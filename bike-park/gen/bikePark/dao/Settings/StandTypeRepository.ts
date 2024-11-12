import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface StandTypeEntity {
    readonly Id: number;
    Name?: string;
    Description?: string;
}

export interface StandTypeCreateEntity {
    readonly Name?: string;
    readonly Description?: string;
}

export interface StandTypeUpdateEntity extends StandTypeCreateEntity {
    readonly Id: number;
}

export interface StandTypeEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
            Description?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
            Description?: string | string[];
        };
        contains?: {
            Id?: number;
            Name?: string;
            Description?: string;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
            Description?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
            Description?: string;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
            Description?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
            Description?: string;
        };
    },
    $select?: (keyof StandTypeEntity)[],
    $sort?: string | (keyof StandTypeEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface StandTypeEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<StandTypeEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface StandTypeUpdateEntityEvent extends StandTypeEntityEvent {
    readonly previousEntity: StandTypeEntity;
}

export class StandTypeRepository {

    private static readonly DEFINITION = {
        table: "STANDTYPE",
        properties: [
            {
                name: "Id",
                column: "STANDTYPE_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "STANDTYPE_NAME",
                type: "VARCHAR",
            },
            {
                name: "Description",
                column: "STANDTYPE_DESCRIPTION",
                type: "VARCHAR",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(StandTypeRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: StandTypeEntityOptions): StandTypeEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): StandTypeEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: StandTypeCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "STANDTYPE",
            entity: entity,
            key: {
                name: "Id",
                column: "STANDTYPE_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: StandTypeUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "STANDTYPE",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "STANDTYPE_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: StandTypeCreateEntity | StandTypeUpdateEntity): number {
        const id = (entity as StandTypeUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as StandTypeUpdateEntity);
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
            table: "STANDTYPE",
            entity: entity,
            key: {
                name: "Id",
                column: "STANDTYPE_ID",
                value: id
            }
        });
    }

    public count(options?: StandTypeEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "STANDTYPE"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: StandTypeEntityEvent | StandTypeUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("BikePark-Settings-StandType", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("BikePark-Settings-StandType").send(JSON.stringify(data));
    }
}
