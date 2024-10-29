import { BikeStandRepository as BikeStandDao } from "BikePark/gen/bikePark/dao/BikeStand/BikeStandRepository";
import { StandSuggestionRepository as BikeStandSuggestionDao } from "BikePark/gen/bikePark/dao/BikeStandSuggestion/StandSuggestionRepository";
import { CoordinateRepository as CoordinateDao } from "BikePark/gen/bikePark/dao/Settings/CoordinateRepository";
import { StandTypeRepository as StandTypeDao } from "BikePark/gen/bikePark/dao/Settings/StandTypeRepository";
import { ApiKeyRepository as ApiKeyDao } from "BikePark/gen/bikePark/dao/Settings/ApiKeyRepository"

import { Controller, Get, Post, response } from "sdk/http";

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
    public async BikeStandData() {
        let allBikeStands = await this.bikeStandDao.findAll();

        let coordinates = await this.coordinateDao.findAll();
        let standTypes = await this.standTypeDao.findAll();

        let coordinateMap = new Map(coordinates.map(c => [c.Id, { latitude: c.Latitude, longitude: c.Longitude }]));
        let standTypeMap = new Map(standTypes.map(st => [st.Id, st.Name]));

        let fullBikeStands = allBikeStands.map(bikeStand => {

            return {
                ...bikeStand,
                latitude: coordinateMap.get(bikeStand.Coordinate || 0)?.latitude,
                longitude: coordinateMap.get(bikeStand.Coordinate || 0)?.longitude,
                standTypeName: standTypeMap.get(bikeStand.StandType || 0)
            };
        });

        return fullBikeStands;
    }

    @Get("/BikeStandSuggestionData")
    public async BikeStandSuggestionData() {
        let allBikeStandSuggestions = await this.bikeStandSuggestionDao.findAll();

        let coordinates = await this.coordinateDao.findAll();
        let standTypes = await this.standTypeDao.findAll();

        let coordinateMap = new Map(coordinates.map(c => [c.Id, { latitude: c.Latitude, longitude: c.Longitude }]));
        let standTypeMap = new Map(standTypes.map(st => [st.Id, st.Name]));

        let fullBikeStandSuggestions = allBikeStandSuggestions.map(bikeStandSuggestion => {

            return {
                ...bikeStandSuggestion,
                latitude: coordinateMap.get(bikeStandSuggestion.Coordinate || 0)?.latitude,
                longitude: coordinateMap.get(bikeStandSuggestion.Coordinate || 0)?.longitude,
                standTypeName: standTypeMap.get(bikeStandSuggestion.StandType || 0)
            };
        });

        return fullBikeStandSuggestions;
    }

    @Get("/ClosestBikeStands")
    public ClosestBikeStands(body: any) {
        try {
            ["Latitude", "Longitude", "Limit"].forEach(elem => {
                if (!body.hasOwnProperty(elem)) {
                    response.setStatus(response.BAD_REQUEST);
                    return "Body does not match the requirements!";
                }
            })

            let allBikeStands = this.bikeStandDao.findAll();
            let coordinates = this.coordinateDao.findAll();

            let coordinateMap = new Map(coordinates.map(c => [c.Id, { latitude: c.Latitude, longitude: c.Longitude }]));

            let bikeStandsWithDistance = allBikeStands
                .map(bikeStand => {
                    const coord = coordinateMap.get(bikeStand.Coordinate || 0);

                    if (coord) {
                        const distance = this.calculateDistance(
                            body.Latitude,
                            body.Longitude,
                            coord.latitude || 0,
                            coord.longitude || 0
                        );
                        return {
                            ...bikeStand,
                            latitude: coord.latitude,
                            longitude: coord.longitude,
                            distance
                        };
                    }
                    return null;
                })
                .filter(bikeStand => bikeStand !== null) as any[];

            bikeStandsWithDistance.sort((a, b) => a.distance - b.distance);
            return bikeStandsWithDistance.slice(0, body.Limit);
        }
        catch (error) {
            response.setStatus(response.BAD_REQUEST);
            return "An error occurred posting new suggestion!";
        }
    }

    @Get("/StandTypesData")
    public StandTypesData() {
        let allStandTypes = this.standTypeDao.findAll();

        return allStandTypes;
    }

    @Get("/ApiKey/:ApiKeyId")
    public ApiKey(_: any, ctx: any) {
        const apiKeyId = ctx.pathParameters.ApiKeyId;
        const apiKey = this.apiKeyDao.findById(apiKeyId);

        if (!apiKey) {
            response.setStatus(response.BAD_REQUEST);
            return "There isn't an API KEY with this Id!";
        }

        return apiKey.Key;
    }

    @Post("/BikeStandSuggestion")
    public async createBikeStandSuggestion(body: any) {
        try {
            ["Location", "SlotCount", "StandTypeId", "Latitude", "Longitude"].forEach(elem => {
                if (!body.hasOwnProperty(elem)) {
                    response.setStatus(response.BAD_REQUEST);
                    return "Body does not match the requirements!";
                }
            })

            let standType = await this.standTypeDao.findById(body.StandTypeId);

            if (!standType) {
                response.setStatus(response.BAD_REQUEST);
                return "Incorrect stand type!";
            }

            let coordinates = await this.coordinateDao.findAll();
            let coordinateMap = new Map(coordinates.map(c => [c.Id, { latitude: c.Latitude, longitude: c.Longitude }]));

            let allBikeStands = await this.bikeStandDao.findAll();
            let allBikeStandSuggestions = await this.bikeStandSuggestionDao.findAll();

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
                coordinateId = await this.coordinateDao.create({
                    Latitude: body.Latitude,
                    Longitude: body.Longitude,
                    Name: body.Location
                });
            }

            let newSuggestion = await this.bikeStandSuggestionDao.create({
                Location: body.Location,
                SlotCount: body.SlotCount,
                StandType: body.StandTypeId,
                Coordinate: coordinateId
            });

            return newSuggestion;
        }

        catch (error) {
            response.setStatus(response.BAD_REQUEST);
            return "An error occurred posting new suggestion!";
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