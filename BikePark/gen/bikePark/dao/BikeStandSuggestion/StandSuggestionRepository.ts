import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface StandSuggestionEntity {
    readonly Id: number;
    Location?: string;
    SlotCount?: number;
    StandType?: number;
    Coordinate?: number;
}

export interface StandSuggestionCreateEntity {
    readonly Location?: string;
    readonly SlotCount?: number;
    readonly StandType?: number;
    readonly Coordinate?: number;
}

export interface StandSuggestionUpdateEntity extends StandSuggestionCreateEntity {
    readonly Id: number;
}

export interface StandSuggestionEntityOptions {
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
    $select?: (keyof StandSuggestionEntity)[],
    $sort?: string | (keyof StandSuggestionEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface StandSuggestionEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<StandSuggestionEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface StandSuggestionUpdateEntityEvent extends StandSuggestionEntityEvent {
    readonly previousEntity: StandSuggestionEntity;
}

export class StandSuggestionRepository {

    private static readonly DEFINITION = {
        table: "STANDSUGGESTION",
        properties: [
            {
                name: "Id",
                column: "STANDSUGGESTION_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Location",
                column: "STANDSUGGESTION_LOCATION",
                type: "VARCHAR",
            },
            {
                name: "SlotCount",
                column: "STANDSUGGESTION_SLOTCOUNT",
                type: "INTEGER",
            },
            {
                name: "StandType",
                column: "STANDSUGGESTION_STANDTYPE",
                type: "INTEGER",
            },
            {
                name: "Coordinate",
                column: "STANDSUGGESTION_COORDINATE",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(StandSuggestionRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: StandSuggestionEntityOptions): StandSuggestionEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): StandSuggestionEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: StandSuggestionCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "STANDSUGGESTION",
            entity: entity,
            key: {
                name: "Id",
                column: "STANDSUGGESTION_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: StandSuggestionUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "STANDSUGGESTION",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "STANDSUGGESTION_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: StandSuggestionCreateEntity | StandSuggestionUpdateEntity): number {
        const id = (entity as StandSuggestionUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as StandSuggestionUpdateEntity);
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
            table: "STANDSUGGESTION",
            entity: entity,
            key: {
                name: "Id",
                column: "STANDSUGGESTION_ID",
                value: id
            }
        });
    }

    public count(options?: StandSuggestionEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "STANDSUGGESTION"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: StandSuggestionEntityEvent | StandSuggestionUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("BikePark-BikeStandSuggestion-StandSuggestion", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("BikePark-BikeStandSuggestion-StandSuggestion").send(JSON.stringify(data));
    }
}
