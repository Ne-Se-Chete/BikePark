import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface ApiKeyEntity {
    readonly Id: number;
    Key?: string;
}

export interface ApiKeyCreateEntity {
    readonly Key?: string;
}

export interface ApiKeyUpdateEntity extends ApiKeyCreateEntity {
    readonly Id: number;
}

export interface ApiKeyEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Key?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            Key?: string | string[];
        };
        contains?: {
            Id?: number;
            Key?: string;
        };
        greaterThan?: {
            Id?: number;
            Key?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Key?: string;
        };
        lessThan?: {
            Id?: number;
            Key?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            Key?: string;
        };
    },
    $select?: (keyof ApiKeyEntity)[],
    $sort?: string | (keyof ApiKeyEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface ApiKeyEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<ApiKeyEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface ApiKeyUpdateEntityEvent extends ApiKeyEntityEvent {
    readonly previousEntity: ApiKeyEntity;
}

export class ApiKeyRepository {

    private static readonly DEFINITION = {
        table: "APIKEY",
        properties: [
            {
                name: "Id",
                column: "APIKEY_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Key",
                column: "APIKEY_KEY",
                type: "VARCHAR",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(ApiKeyRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: ApiKeyEntityOptions): ApiKeyEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): ApiKeyEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: ApiKeyCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "APIKEY",
            entity: entity,
            key: {
                name: "Id",
                column: "APIKEY_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: ApiKeyUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "APIKEY",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "APIKEY_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: ApiKeyCreateEntity | ApiKeyUpdateEntity): number {
        const id = (entity as ApiKeyUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as ApiKeyUpdateEntity);
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
            table: "APIKEY",
            entity: entity,
            key: {
                name: "Id",
                column: "APIKEY_ID",
                value: id
            }
        });
    }

    public count(options?: ApiKeyEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "APIKEY"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: ApiKeyEntityEvent | ApiKeyUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("bike-park-Settings-ApiKey", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("bike-park-Settings-ApiKey").send(JSON.stringify(data));
    }
}
