import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface BikeStandEntity {
    readonly Id: number;
    Location?: string;
    SlotCount?: number;
    StandType?: number;
    Coordinate?: number;
}

export interface BikeStandCreateEntity {
    readonly Location?: string;
    readonly SlotCount?: number;
    readonly StandType?: number;
    readonly Coordinate?: number;
}

export interface BikeStandUpdateEntity extends BikeStandCreateEntity {
    readonly Id: number;
}

export interface BikeStandEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Location?: string | string[];
            SlotCount?: number | number[];
            StandType?: number | number[];
            Coordinate?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Location?: string | string[];
            SlotCount?: number | number[];
            StandType?: number | number[];
            Coordinate?: number | number[];
        };
        contains?: {
            Id?: number;
            Location?: string;
            SlotCount?: number;
            StandType?: number;
            Coordinate?: number;
        };
        greaterThan?: {
            Id?: number;
            Location?: string;
            SlotCount?: number;
            StandType?: number;
            Coordinate?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Location?: string;
            SlotCount?: number;
            StandType?: number;
            Coordinate?: number;
        };
        lessThan?: {
            Id?: number;
            Location?: string;
            SlotCount?: number;
            StandType?: number;
            Coordinate?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Location?: string;
            SlotCount?: number;
            StandType?: number;
            Coordinate?: number;
        };
    },
    $select?: (keyof BikeStandEntity)[],
    $sort?: string | (keyof BikeStandEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface BikeStandEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<BikeStandEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface BikeStandUpdateEntityEvent extends BikeStandEntityEvent {
    readonly previousEntity: BikeStandEntity;
}

export class BikeStandRepository {

    private static readonly DEFINITION = {
        table: "BIKESTAND",
        properties: [
            {
                name: "Id",
                column: "BIKESTAND_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Location",
                column: "BIKESTAND_LOCATION",
                type: "VARCHAR",
            },
            {
                name: "SlotCount",
                column: "BIKESTAND_SLOTCOUNT",
                type: "INTEGER",
            },
            {
                name: "StandType",
                column: "BIKESTAND_STANDTYPE",
                type: "INTEGER",
            },
            {
                name: "Coordinate",
                column: "BIKESTAND_COORDINATE",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(BikeStandRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: BikeStandEntityOptions): BikeStandEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): BikeStandEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: BikeStandCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "BIKESTAND",
            entity: entity,
            key: {
                name: "Id",
                column: "BIKESTAND_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: BikeStandUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "BIKESTAND",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "BIKESTAND_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: BikeStandCreateEntity | BikeStandUpdateEntity): number {
        const id = (entity as BikeStandUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as BikeStandUpdateEntity);
            return id;
        } else {
            return this.create(entity);
        }
    }

    public deleteById(id: number): void {
        const entity = this.dao.find(id);
        this.dao.remove(id);
        this.triggerEvent({
            operation: "delete",
            table: "BIKESTAND",
            entity: entity,
            key: {
                name: "Id",
                column: "BIKESTAND_ID",
                value: id
            }
        });
    }

    public count(options?: BikeStandEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "BIKESTAND"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: BikeStandEntityEvent | BikeStandUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("bike-park-BikeStand-BikeStand", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("bike-park-BikeStand-BikeStand").send(JSON.stringify(data));
    }
}
