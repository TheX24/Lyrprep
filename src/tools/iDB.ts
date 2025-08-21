// IndexedDB utility for Lyrprep (Class-based)
'use strict';

// Safari and older browser fallbacks
const _global: typeof globalThis = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis);
const _globalAny = _global as any;
const _indexedDB: IDBFactory | undefined = _globalAny.indexedDB || _globalAny.webkitIndexedDB || _globalAny.mozIndexedDB || _globalAny.msIndexedDB;
const _IDBKeyRange: typeof IDBKeyRange = (_globalAny.IDBKeyRange || _globalAny.webkitIDBKeyRange || _globalAny.mozIDBKeyRange || _globalAny.msIDBKeyRange);

	function nowMs() { return Date.now(); }



	// Serialize content to string as required by spec
	function serializeContent(value: unknown): string {
		if (value == null) return '';
		if (typeof value === 'string') return value;
		try { return JSON.stringify(value); } catch (_) { return String(value); }
	}

	// Types
	type PayloadType = 'expire' | 'store';
	type StoreIndexDef = { name: string; keyPath: string; options?: IDBIndexParameters };
	type StoreDef = { name: string; keyPath: string; indexes: StoreIndexDef[] };
	type StoresConfig = { items: StoreDef; versions: StoreDef };

	type DBOptions = {
		dbName?: string;
		version?: number;
		defaults?: { expireTtlMs?: number };
	};

	type DBInternalConfig = {
		dbName: string;
		version: number;
		payloadVersion: number;
		stores: StoresConfig;
		defaults: { expireTtlMs: number };
	};

	type Payload = {
		Type: PayloadType;
		StoreVersion: number;
		Content: string;
	};

	type ItemRecord = Payload & {
		id: string;
		version: number;
		createdAt: number;
		updatedAt: number;
		expiresAt: number | null;
	};

	type VersionRecord = Payload & {
		versionKey: string;
		id: string;
		version: number;
		createdAt: number;
		updatedAt: number;
		expiresAt: number | null;
	};

	// Build the shape required by the user spec to store
	function buildPayloadShape(type: PayloadType, storeVersion: number, content: unknown): Payload {
		return {
			Type: type,
			StoreVersion: storeVersion,
			Content: serializeContent(content),
		};
	}

class DB {
	private config: DBInternalConfig;

	constructor(options: DBOptions = {}) {
		const incoming = options || {};
		const defaults = incoming.defaults && typeof incoming.defaults === 'object' ? incoming.defaults : {};
		// Fixed stores definition (not configurable via options)
		const fixedStores = {
			// Stores the latest record per key (id)
			items: {
				name: 'items',
				keyPath: 'id',
				indexes: [
					{ name: 'expiresAt', keyPath: 'expiresAt', options: { unique: false } },
					{ name: 'type', keyPath: 'Type', options: { unique: false } },
					{ name: 'updatedAt', keyPath: 'updatedAt', options: { unique: false } },
				],
			},
			// Append-only history of versions for each id
			versions: {
				name: 'versions',
				keyPath: 'versionKey', // `${id}:${version}`
				indexes: [
					{ name: 'id', keyPath: 'id', options: { unique: false } },
					{ name: 'version', keyPath: 'version', options: { unique: false } },
					{ name: 'expiresAt', keyPath: 'expiresAt', options: { unique: false } },
					{ name: 'createdAt', keyPath: 'createdAt', options: { unique: false } },
				],
			},
		};

		this.config = {
			dbName: typeof incoming.dbName === 'string' && incoming.dbName ? incoming.dbName : 'LyrprepDB',
			version: 1, // Fixed IndexedDB schema version
			payloadVersion: (typeof incoming.version === 'number' && Number.isFinite(incoming.version)) ? incoming.version : 1, // User-specified StoreVersion
			stores: fixedStores,
			defaults: {
				expireTtlMs: (typeof defaults.expireTtlMs === 'number' && Number.isFinite(defaults.expireTtlMs)) ? defaults.expireTtlMs : (1000 * 60 * 60 * 24 * 7),
			},
		};

		try { this.pruneExpired(); } catch (_) {}
	}

	/** @returns {Promise<IDBDatabase>} */
	openDB(): Promise<IDBDatabase> {
		if (!_indexedDB) {
			return Promise.reject(new Error('IndexedDB is not supported in this environment'));
		}
		return new Promise((resolve, reject) => {
			const openRequest = _indexedDB.open(this.config.dbName, this.config.version);

			openRequest.onupgradeneeded = () => {
				const db = openRequest.result;

				// items store
				if (!db.objectStoreNames.contains(this.config.stores.items.name)) {
					const store = db.createObjectStore(
						this.config.stores.items.name,
						{ keyPath: this.config.stores.items.keyPath }
					);
					for (const idx of this.config.stores.items.indexes) {
						try { store.createIndex(idx.name, idx.keyPath, idx.options || {}); } catch (_) {}
					}
				} else {
					const tx = openRequest.transaction;
					if (!tx) { return; }
					const store = tx.objectStore(this.config.stores.items.name);
					const indexNames = Array.from(store.indexNames);
					for (const idx of this.config.stores.items.indexes) {
						if (indexNames.indexOf(idx.name) === -1) {
							try { store.createIndex(idx.name, idx.keyPath, idx.options || {}); } catch (_) {}
						}
					}
				}

				// versions store
				if (!db.objectStoreNames.contains(this.config.stores.versions.name)) {
					const store = db.createObjectStore(
						this.config.stores.versions.name,
						{ keyPath: this.config.stores.versions.keyPath }
					);
					for (const idx of this.config.stores.versions.indexes) {
						try { store.createIndex(idx.name, idx.keyPath, idx.options || {}); } catch (_) {}
					}
				} else {
					const tx = openRequest.transaction;
					if (!tx) { return; }
					const store = tx.objectStore(this.config.stores.versions.name);
					const indexNames = Array.from(store.indexNames);
					for (const idx of this.config.stores.versions.indexes) {
						if (indexNames.indexOf(idx.name) === -1) {
							try { store.createIndex(idx.name, idx.keyPath, idx.options || {}); } catch (_) {}
						}
					}
				}
			};

			openRequest.onsuccess = () => resolve(openRequest.result);
			openRequest.onerror = () => reject(openRequest.error);
		});
	}

	async getNextVersion(db: IDBDatabase, id: string): Promise<number> {
		const tx = db.transaction([this.config.stores.items.name], 'readonly');
		const items = tx.objectStore(this.config.stores.items.name);
		const existing = await new Promise<ItemRecord | undefined>((resolve, reject) => {
			const req = items.get(id);
			req.onsuccess = () => resolve(req.result as ItemRecord | undefined);
			req.onerror = () => reject(req.error);
		});
		await new Promise((r) => { tx.oncomplete = r; tx.onerror = r; tx.onabort = r; });
		return (existing && typeof existing.version === 'number') ? existing.version + 1 : 1;
	}

	async putVersionRecord(tx: IDBTransaction, data: VersionRecord): Promise<boolean> {
		const versions = tx.objectStore(this.config.stores.versions.name);
		return new Promise((resolve, reject) => {
			const req = versions.put(data);
			req.onsuccess = () => resolve(true);
			req.onerror = () => reject(req.error);
		});
	}

	async putItemRecord(tx: IDBTransaction, data: ItemRecord): Promise<boolean> {
		const items = tx.objectStore(this.config.stores.items.name);
		return new Promise((resolve, reject) => {
			const req = items.put(data);
			req.onsuccess = () => resolve(true);
			req.onerror = () => reject(req.error);
		});
	}

	async deleteItemRecord(tx: IDBTransaction, id: string): Promise<boolean> {
		const items = tx.objectStore(this.config.stores.items.name);
		return new Promise((resolve, reject) => {
			const req = items.delete(id);
			req.onsuccess = () => resolve(true);
			req.onerror = () => reject(req.error);
		});
	}

	async deleteAllVersionsForId(tx: IDBTransaction, id: string): Promise<boolean> {
		const versions = tx.objectStore(this.config.stores.versions.name);
		const byId = versions.index('id');
		const range = _IDBKeyRange.only(id);
		return new Promise((resolve, reject) => {
			const req = byId.openCursor(range);
			req.onerror = () => reject(req.error);
			req.onsuccess = () => {
				const cursor = req.result as IDBCursorWithValue | null;
				if (!cursor) { resolve(true); return; }
				cursor.delete();
				cursor.continue();
			};
		});
	}

	async pruneExpiredInternal(db: IDBDatabase): Promise<void> {
		const tx = db.transaction([this.config.stores.items.name, this.config.stores.versions.name], 'readwrite');
		const items = tx.objectStore(this.config.stores.items.name);
		const versions = tx.objectStore(this.config.stores.versions.name);
		const idxItemsExp = items.index('expiresAt');
		const idxVersExp = versions.index('expiresAt');
		const now = nowMs();

		// Delete expired from items (and their versions)
		await new Promise((resolve, reject) => {
			let req: IDBRequest<IDBCursorWithValue | null>;
			try { req = idxItemsExp.openCursor(_IDBKeyRange.upperBound(now)); } catch (e) { reject(e); return; }
			req.onerror = () => reject(req.error);
			req.onsuccess = async () => {
				const cursor = req.result as IDBCursorWithValue | null;
				if (!cursor) { resolve(true); return; }
				try {
					await this.deleteAllVersionsForId(tx, cursor.value.id as string);
					cursor.delete();
					cursor.continue();
				} catch (err) { reject(err); }
			};
		});

		// Additionally prune expired versions independently
		await new Promise((resolve, reject) => {
			let req: IDBRequest<IDBCursorWithValue | null>;
			try { req = idxVersExp.openCursor(_IDBKeyRange.upperBound(now)); } catch (e) { reject(e); return; }
			req.onerror = () => reject(req.error);
			req.onsuccess = () => {
				const cursor = req.result as IDBCursorWithValue | null;
				if (!cursor) { resolve(true); return; }
				cursor.delete();
				cursor.continue();
			};
		});

		await new Promise((r) => { tx.oncomplete = r; tx.onerror = r; tx.onabort = r; });
	}

	// Public API
	get configRef(): DBInternalConfig { return this.config; }

	async save(id: string, content: unknown, options?: { type?: PayloadType; ttlMs?: number }): Promise<Payload> {
		const type: PayloadType = (options && options.type === 'expire') ? 'expire' : 'store';
		const storeVersionUsed = this.config.payloadVersion;
		const ttlMs = (options && typeof options.ttlMs === 'number') ? options.ttlMs : this.config.defaults.expireTtlMs;

		const db = await this.openDB();
		try {
			const version = await this.getNextVersion(db, id);
			const now = nowMs();
			const expiresAt = (type === 'expire') ? (now + ttlMs) : null;

			const payload = buildPayloadShape(type, storeVersionUsed, content);
			const itemRecord: ItemRecord = {
				id,
				version,
				...payload,
				createdAt: now,
				updatedAt: now,
				expiresAt,
			};
			const versionRecord: VersionRecord = {
				versionKey: `${id}:${version}`,
				id,
				version,
				...payload,
				createdAt: now,
				updatedAt: now,
				expiresAt,
			};

			const tx = db.transaction([this.config.stores.items.name, this.config.stores.versions.name], 'readwrite');
			await this.putItemRecord(tx, itemRecord);
			await this.putVersionRecord(tx, versionRecord);
			await new Promise((r, j) => { tx.oncomplete = r; tx.onerror = () => j(tx.error); tx.onabort = () => j(tx.error); });

			return { ...payload };
		} finally {
			db.close();
		}
	}

	async savePermanent(id: string, content: unknown, options?: { ttlMs?: number }): Promise<Payload> {
		return this.save(id, content, { ...(options || {}), type: 'store' });
	}

	async saveExpiring(id: string, content: unknown, ttlMs: number, options?: { }): Promise<Payload> {
		return this.save(id, content, { ...(options || {}), type: 'expire', ttlMs });
	}

	async get(id: string): Promise<string | undefined> {
		const db = await this.openDB();
		try {
			const tx = db.transaction([this.config.stores.items.name], 'readonly');
			const items = tx.objectStore(this.config.stores.items.name);
			const record = await new Promise<ItemRecord | undefined>((resolve, reject) => {
				const req = items.get(id);
				req.onsuccess = () => resolve(req.result as ItemRecord | undefined);
				req.onerror = () => reject(req.error);
			});
			await new Promise((r) => { tx.oncomplete = r; tx.onerror = r; tx.onabort = r; });

			if (!record) return undefined;
			if (record.Type === 'expire' && typeof record.expiresAt === 'number' && record.expiresAt <= nowMs()) {
				try { await this.pruneExpiredInternal(db); } catch (_) {}
				return undefined;
			}

			// Version check against constructor-specified payload version
			if (typeof this.config.payloadVersion === 'number' && record.StoreVersion !== this.config.payloadVersion) {
				try {
					const delTx = db.transaction([this.config.stores.items.name], 'readwrite');
					await this.deleteItemRecord(delTx, id);
					await new Promise((r, j) => { delTx.oncomplete = r; delTx.onerror = () => j(delTx.error); delTx.onabort = () => j(delTx.error); });
				} catch (_) {}
				return undefined;
			}

			return record.Content;
		} finally {
			db.close();
		}
	}

	async getVersion(id: string, version: number): Promise<Payload | null> {
		const db = await this.openDB();
		try {
			const tx = db.transaction([this.config.stores.versions.name], 'readonly');
			const versions = tx.objectStore(this.config.stores.versions.name);
			const rec = await new Promise<VersionRecord | undefined>((resolve, reject) => {
				const req = versions.get(`${id}:${version}`);
				req.onsuccess = () => resolve(req.result as VersionRecord | undefined);
				req.onerror = () => reject(req.error);
			});
			await new Promise((r) => { tx.oncomplete = r; tx.onerror = r; tx.onabort = r; });
			if (!rec) return null;
			if (rec.Type === 'expire' && typeof rec.expiresAt === 'number' && rec.expiresAt <= nowMs()) return null;
			return { Type: rec.Type, StoreVersion: rec.StoreVersion, Content: rec.Content };
		} finally {
			db.close();
		}
	}

	async listKeys(): Promise<IDBValidKey[]> {
		const db = await this.openDB();
		try {
			const tx = db.transaction([this.config.stores.items.name], 'readonly');
			const items = tx.objectStore(this.config.stores.items.name);
			const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
				const req = items.getAllKeys();
				req.onsuccess = () => resolve(req.result as IDBValidKey[]);
				req.onerror = () => reject(req.error);
			});
			await new Promise((r) => { tx.oncomplete = r; tx.onerror = r; tx.onabort = r; });
			return keys || [];
		} finally {
			db.close();
		}
	}

	async listVersions(id: string): Promise<number[]> {
		const db = await this.openDB();
		try {
			const tx = db.transaction([this.config.stores.versions.name], 'readonly');
			const versions = tx.objectStore(this.config.stores.versions.name).index('id');
			const range = _IDBKeyRange.only(id);
			const out: number[] = [];
			await new Promise((resolve, reject) => {
				const req = versions.openCursor(range);
				req.onerror = () => reject(req.error);
				req.onsuccess = () => {
					const cursor = req.result as IDBCursorWithValue | null;
					if (!cursor) { resolve(true); return; }
					out.push((cursor.value as VersionRecord).version);
					cursor.continue();
				};
			});
			return out;
		} finally {
			db.close();
		}
	}

	async remove(id: string): Promise<void> {
		const db = await this.openDB();
		try {
			const tx = db.transaction([this.config.stores.items.name], 'readwrite');
			await this.deleteItemRecord(tx, id);
			await new Promise((r, j) => { tx.oncomplete = r; tx.onerror = () => j(tx.error); tx.onabort = () => j(tx.error); });
		} finally {
			db.close();
		}
	}

	async removeAllVersions(id: string): Promise<void> {
		const db = await this.openDB();
		try {
			const tx = db.transaction([this.config.stores.items.name, this.config.stores.versions.name], 'readwrite');
			await this.deleteAllVersionsForId(tx, id);
			await this.deleteItemRecord(tx, id);
			await new Promise((r, j) => { tx.oncomplete = r; tx.onerror = () => j(tx.error); tx.onabort = () => j(tx.error); });
		} finally {
			db.close();
		}
	}

	async pruneExpired(): Promise<void> {
		const db = await this.openDB();
		try { await this.pruneExpiredInternal(db); } finally { db.close(); }
	}

	async clearAll(): Promise<void> {
		const db = await this.openDB();
		try {
			const tx = db.transaction([this.config.stores.items.name, this.config.stores.versions.name], 'readwrite');
			tx.objectStore(this.config.stores.items.name).clear();
			tx.objectStore(this.config.stores.versions.name).clear();
			await new Promise((r, j) => { tx.oncomplete = r; tx.onerror = () => j(tx.error); tx.onabort = () => j(tx.error); });
		} finally { db.close(); }
	}
}

export { DB };
export default DB;