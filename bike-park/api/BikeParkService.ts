import { BikeStandRepository as BikeStandDao } from "bike-park/gen/bike-park/dao/BikeStand/BikeStandRepository";
import { StandSuggestionRepository as BikeStandSuggestionDao } from "bike-park/gen/bike-park/dao/BikeStandSuggestion/StandSuggestionRepository";
import { CoordinateRepository as CoordinateDao } from "bike-park/gen/bike-park/dao/Settings/CoordinateRepository";
import { StandTypeRepository as StandTypeDao } from "bike-park/gen/bike-park/dao/Settings/StandTypeRepository";
import { ApiKeyRepository as ApiKeyDao } from "bike-park/gen/bike-park/dao/Settings/ApiKeyRepository"

import { Env } from "sdk/core";
import { Controller, Get, Post, response, } from "sdk/http";

@Controller
class BikeParkService {
    private readonly bikeStandDao;
    private readonly bikeStandSuggestionDao;
    private readonly coordinateDao;
    private readonly standTypeDao;
    private readonly apiKeyDao;

    constructor() {
        this.bikeStandDao = new BikeStandDao();
        this.bikeStandSuggestionDao = new BikeStandSuggestionDao();
        this.coordinateDao = new CoordinateDao();
        this.standTypeDao = new StandTypeDao();
        this.apiKeyDao = new ApiKeyDao();
    }

    @Get("/BikeStandData")
    public BikeStandData() {
        let allBikeStands = this.bikeStandDao.findAll();

        let coordinates = this.coordinateDao.findAll();
        let standTypes = this.standTypeDao.findAll();

        let coordinateMap = new Map(coordinates.map(c => [c.Id, { latitude: c.Latitude, longitude: c.Longitude }]));
        let standTypeMap = new Map(standTypes.map(st => [st.Id, st.Name]));

        let fullBikeStands = allBikeStands.map(bikeStand => {
            return {
                Location: bikeStand.Location,
                SlotCount: bikeStand.SlotCount,
                Latitude: coordinateMap.get(bikeStand.Coordinate || 0)?.latitude,
                Longitude: coordinateMap.get(bikeStand.Coordinate || 0)?.longitude,
                StandTypeName: standTypeMap.get(bikeStand.StandType || 0)
            };
        });

        return fullBikeStands;
    }

    @Get("/BikeStandSuggestionData")
    public BikeStandSuggestionData() {
        let allBikeStandSuggestions = this.bikeStandSuggestionDao.findAll();

        let coordinates = this.coordinateDao.findAll();
        let standTypes = this.standTypeDao.findAll();

        let coordinateMap = new Map(coordinates.map(c => [c.Id, { latitude: c.Latitude, longitude: c.Longitude }]));
        let standTypeMap = new Map(standTypes.map(st => [st.Id, st.Name]));

        let fullBikeStandSuggestions = allBikeStandSuggestions.map(bikeStandSuggestion => {

            return {
                ...bikeStandSuggestion,
                Latitude: coordinateMap.get(bikeStandSuggestion.Coordinate || 0)?.latitude,
                Longitude: coordinateMap.get(bikeStandSuggestion.Coordinate || 0)?.longitude,
                StandTypeName: standTypeMap.get(bikeStandSuggestion.StandType || 0)
            };
        });

        return fullBikeStandSuggestions;
    }

    @Get("/StandTypesData")
    public StandTypesData() {
        let allStandTypes = this.standTypeDao.findAll();

        return allStandTypes;
    }

    @Get("/ApiKey/:ApiKeyName")
    public ApiKey(_: any, ctx: any) {
        const apiKeyName = ctx.pathParameters.ApiKeyName;
        const apiKey = Env.get(apiKeyName);

        if (!apiKey) {
            response.setStatus(response.BAD_REQUEST);
            return "There isn't an API KEY with this Name!";
        }

        return apiKey;
    }

    @Post("/BikeStandSuggestion")
    public createBikeStandSuggestion(body: any, _: any) {

        try {

            ["Location", "SlotCount", "StandType", "Latitude", "Longitude"].forEach(elem => {
                if (!body[elem]) {
                    response.setStatus(response.BAD_REQUEST);
                    return "Body does not match the requirements!";
                }
            });

            let standType = this.standTypeDao.findById(body.StandType);

            if (!standType) {
                response.setStatus(response.BAD_REQUEST);
                return "Incorrect stand type!";
            }

            let coordinates = this.coordinateDao.findAll();
            let coordinateMap = new Map(coordinates.map(c => [c.Id, { latitude: c.Latitude, longitude: c.Longitude }]));

            let allBikeStands = this.bikeStandDao.findAll();
            let allBikeStandSuggestions = this.bikeStandSuggestionDao.findAll();

            let existingStand = allBikeStands.some(bikeStand => {
                let coord = coordinateMap.get(bikeStand.Coordinate || 0);
                return coord && coord.latitude === body.Latitude && coord.longitude === body.Longitude;
            });

            let existingSuggestion = allBikeStandSuggestions.some(suggestion => {
                let coord = coordinateMap.get(suggestion.Coordinate || 0);
                return coord && coord.latitude === body.Latitude && coord.longitude === body.Longitude;
            });

            if (existingStand || existingSuggestion) {
                response.setStatus(response.BAD_REQUEST);
                return "Suggestion on this location already exists!";
            }

            let existingCoordinate = coordinates.find(c => c.Latitude === body.Latitude && c.Longitude === body.Longitude);
            let coordinateId;

            if (existingCoordinate) {
                coordinateId = existingCoordinate.Id;
            }

            else {
                coordinateId = this.coordinateDao.create({
                    Latitude: body.Latitude,
                    Longitude: body.Longitude,
                    Name: body.Location
                });
            }

            let newSuggestion = this.bikeStandSuggestionDao.create({
                Location: body.Location,
                SlotCount: body.SlotCount,
                StandType: body.StandType,
                Coordinate: coordinateId
            });

            return newSuggestion;
        }

        catch (error) {
            response.setStatus(response.BAD_REQUEST);
            return "An error occurred posting new suggestion:" + error;
        }
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}