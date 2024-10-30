import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface CoordinateEntity {
    readonly Id: number;
    Latitude?: number;
    Longitude?: number;
    Name?: string;
}

export interface CoordinateCreateEntity {
    readonly Latitude?: number;
    readonly Longitude?: number;
    readonly Name?: string;
}

export interface CoordinateUpdateEntity extends CoordinateCreateEntity {
    readonly Id: number;
}

export interface CoordinateEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Latitude?: number | number[];
            Longitude?: number | number[];
            Name?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            Latitude?: number | number[];
            Longitude?: number | number[];
            Name?: string | string[];
        };
        contains?: {
            Id?: number;
            Latitude?: number;
            Longitude?: number;
            Name?: string;
        };
        greaterThan?: {
            Id?: number;
            Latitude?: number;
            Longitude?: number;
            Name?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Latitude?: number;
            Longitude?: number;
            Name?: string;
        };
        lessThan?: {
            Id?: number;
            Latitude?: number;
            Longitude?: number;
            Name?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            Latitude?: number;
            Longitude?: number;
            Name?: string;
        };
    },
    $select?: (keyof CoordinateEntity)[],
    $sort?: string | (keyof CoordinateEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface CoordinateEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<CoordinateEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface CoordinateUpdateEntityEvent extends CoordinateEntityEvent {
    readonly previousEntity: CoordinateEntity;
}

export class CoordinateRepository {

    private static readonly DEFINITION = {
        table: "COORDINATE",
        properties: [
            {
                name: "Id",
                column: "COORDINATE_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Latitude",
                column: "COORDINATE_LATITUDE",
                type: "DOUBLE",
            },
            {
                name: "Longitude",
                column: "COORDINATE_LONGITUDE",
                type: "DOUBLE",
            },
            {
                name: "Name",
                column: "COORDINATE_NAME",
                type: "VARCHAR",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(CoordinateRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: CoordinateEntityOptions): CoordinateEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): CoordinateEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: CoordinateCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "COORDINATE",
            entity: entity,
            key: {
                name: "Id",
                column: "COORDINATE_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: CoordinateUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "COORDINATE",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "COORDINATE_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: CoordinateCreateEntity | CoordinateUpdateEntity): number {
        const id = (entity as CoordinateUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as CoordinateUpdateEntity);
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
            table: "COORDINATE",
            entity: entity,
            key: {
                name: "Id",
                column: "COORDINATE_ID",
                value: id
            }
        });
    }

    public count(options?: CoordinateEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "COORDINATE"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: CoordinateEntityEvent | CoordinateUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("BikePark-Settings-Coordinate", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("BikePark-Settings-Coordinate").send(JSON.stringify(data));
    }
}
