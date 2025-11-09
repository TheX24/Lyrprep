/*
    Code was originally made by @surfbryce, but there was a problem, where the items in the InstantStore,
    were getting OUT of their designated "Items" object.

    This is a fixed and extended version.
*/

// Configuration Types
export type ExpirationSettings = {
    Duration: number;
    Unit: ("Weeks" | "Months" | "Days" | "Hours" | "Minutes" | "Seconds");
}

// Instant Store Types
type InstantStoreItems = Record<string, unknown>;
type InstantStore = {
    Version: number;
    Items: InstantStoreItems;
};
type InstantStoreInterface<Items> = {
    Items: Items;
    SaveChanges: () => void;
};

const RetrievedInstantStores: Set<string> = new Set();

export const GetInstantStore = <InstantStoreTemplate extends InstantStoreItems>(
    storeName: string,
    version: number,
    template: InstantStoreTemplate,
    forceNewData?: true
): Readonly<InstantStoreInterface<InstantStoreTemplate> & { Overwrite: (items: InstantStoreTemplate) => void }> => {
    // Prevent duplicate retrieval
    if (RetrievedInstantStores.has(storeName)) {
        throw new Error(`Can't retrieve InstantStore (${storeName}) twice.`);
    }
    RetrievedInstantStores.add(storeName);

    let store: InstantStore | undefined;

    // Try loading existing
    if (forceNewData === undefined) {
        const serialized = localStorage.getItem(storeName);
        if (serialized !== null) {
            const parsed = JSON.parse(serialized) as InstantStore;
            if (parsed.Version === version) {
                store = parsed;
            }
        }
    }

    // Initialize if missing or forced
    if (store === undefined) {
        store = {
            Version: version,
            Items: JSON.parse(JSON.stringify(template))
        };
    } else {
        // Merge defaults into store.Items only
        const templateChecks: [Record<string, unknown>, Record<string, unknown>, string][] = [
            [store.Items as Record<string, unknown>, template as Record<string, unknown>, `${storeName}.Items`]
        ];

        while (templateChecks.length > 0) {
            const [checkObj, defaultObj, path] = templateChecks.pop()!;
            for (const key in defaultObj) {
                // deno-lint-ignore no-explicit-any
                const have = (checkObj as any)[key];
                const want = defaultObj[key];
                if (have === undefined) {
                    // deno-lint-ignore no-explicit-any
                    (checkObj as any)[key] = JSON.parse(JSON.stringify(want));
                } else if (typeof have === "object" && typeof want === "object") {
                    templateChecks.push([have as Record<string, unknown>, want as Record<string, unknown>, `${path}.${key}`]);
                } else if (typeof have !== typeof want) {
                    throw new Error(`Template Type mismatch for "${path}.${key}"`);
                }
            }
        }
    }

    // Public interface
    return Object.freeze({
        Items: store.Items as InstantStoreTemplate,
        SaveChanges: () => {
            localStorage.setItem(storeName, JSON.stringify(store));
        },
        Overwrite: (items: InstantStoreTemplate) => {
            // Overwrite the entire Items property
            // We clone to avoid reference issues, matching with initialization
            store!.Items = JSON.parse(JSON.stringify(items));
        }
    });
}

// Dynamic Store
export const GetDynamicStoreItem = <I>(storeName: string, itemName: string): I | undefined => {
    const item = localStorage.getItem(`${storeName}:${itemName}`);
    return item !== null ? (item as unknown as I) : undefined;
}

export const SetDynamicStoreItem = (storeName: string, itemName: string, content: string): void => {
    localStorage.setItem(`${storeName}:${itemName}`, content);
}

// Expire Store Types

type ExpireItem<C> = {
    ExpiresAt: number;
    CacheVersion: number;
    Content: C;
};

export type ExpireStoreInterface<ItemType> = {
    GetItem: (itemName: string) => Promise<ItemType | undefined>;
    SetItem: (itemName: string, content: ItemType) => Promise<ItemType>;
    RemoveItem: (itemName: string) => Promise<void>;
    Destroy: () => Promise<void>;
};

const RetrievedExpireStores: Set<string> = new Set();

const GetFromCacheAPI = async <C>(storeName: string, itemName: string): Promise<C | undefined> => {
    const cache = await caches.open(storeName);
    const response = await cache.match(`/${itemName}`);
    return response ? response.json() as Promise<C> : undefined;
}

const UpdateCacheAPI = (storeName: string, itemName: string, content: unknown): Promise<void> => {
    return caches.open(storeName)
        .then(cache =>
            cache.put(
                `/${itemName}`,
                new Response(JSON.stringify(content), {
                    headers: { 'Content-Type': 'application/json' }
                })
            )
        )
        .catch(error => {
            console.warn(`Failed to Update Cache API (${storeName}/${itemName})`);
            console.error(error);
        });
}

export const GetExpireStore = <ItemType>(
    storeName: string,
    version: number,
    itemExpirationSettings: ExpirationSettings,
    forceNewData?: true
): Readonly<ExpireStoreInterface<ItemType>> => {
    if (RetrievedExpireStores.has(storeName)) {
        throw new Error(`Can't retrieve ExpireStore (${storeName}) twice.`);
    }
    RetrievedExpireStores.add(storeName);

    return Object.freeze({
        GetItem: (itemName: string) => {
            if (forceNewData) {
                return Promise.resolve(undefined);
            }
            return GetFromCacheAPI<ExpireItem<ItemType>>(storeName, itemName)
                .then(expireItem => {
                    if (!expireItem || expireItem.CacheVersion !== version || expireItem.ExpiresAt < Date.now()) {
                        return undefined;
                    }
                    return expireItem.Content;
                });
        },
        SetItem: (itemName: string, content: ItemType) => {
            const expireAtDate = new Date();

            // Calculate expiration time based on the unit
            switch (itemExpirationSettings.Unit) {
                case "Weeks":
                    // Reset to start of day and add weeks
                    expireAtDate.setHours(0, 0, 0, 0);
                    expireAtDate.setDate(expireAtDate.getDate() + (itemExpirationSettings.Duration * 7));
                    break;
                case "Months":
                    // Reset to start of day and add months
                    expireAtDate.setHours(0, 0, 0, 0);
                    expireAtDate.setMonth(expireAtDate.getMonth() + itemExpirationSettings.Duration);
                    expireAtDate.setDate(0); // Last day of the month
                    break;
                case "Days":
                    // Reset to start of day and add days
                    expireAtDate.setHours(0, 0, 0, 0);
                    expireAtDate.setDate(expireAtDate.getDate() + itemExpirationSettings.Duration);
                    break;
                case "Hours":
                    // Add hours to current time
                    expireAtDate.setTime(expireAtDate.getTime() + (itemExpirationSettings.Duration * 60 * 60 * 1000));
                    break;
                case "Minutes":
                    // Add minutes to current time
                    expireAtDate.setTime(expireAtDate.getTime() + (itemExpirationSettings.Duration * 60 * 1000));
                    break;
                case "Seconds":
                    // Add seconds to current time
                    expireAtDate.setTime(expireAtDate.getTime() + (itemExpirationSettings.Duration * 1000));
                    break;
            }

            const expireAt = expireAtDate.getTime();
            const expireItem: ExpireItem<ItemType> = {
                ExpiresAt: expireAt,
                CacheVersion: version,
                Content: content
            };
            return UpdateCacheAPI(storeName, itemName, expireItem)
                .then(() => content as ItemType);
        },
        RemoveItem: (itemName: string) => {
            return caches.open(storeName)
                .then(cache => cache.delete(`/${itemName}`))
                .then(wasDeleted => {
                    if (!wasDeleted) {
                        console.warn(`Item '${itemName}' not found in cache store '${storeName}'.`);
                    }
                })
                .catch(error => {
                    console.error(`Error removing item '${itemName}' from cache store '${storeName}':`, error);
                    throw error;
                });
        },
        Destroy: () => {
            return caches.delete(storeName).then(deleted => {
                if (!deleted) {
                    console.warn(`Cache store '${storeName}' could not be deleted or did not exist.`);
                }
                // Allow re-creation
                RetrievedExpireStores.delete(storeName); 
            }).catch(error => {
                console.error(`Error destroying cache store '${storeName}':`, error);
                throw error; // Re-throw the error if you want the caller to handle it
            });
        }
    });
}