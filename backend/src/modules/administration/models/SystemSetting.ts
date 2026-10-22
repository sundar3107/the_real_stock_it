import crypto from 'crypto';
import { db } from '../../../database/connection';
import { ISystemSetting, ISystemSettingsMap } from '../types/administration.types';

export class SystemSettingModel {
  /**
   * Retrieve all settings rows
   */
  static findAll(): ISystemSetting[] {
    const stmt = db.prepare(`
      SELECT id, setting_key, setting_value, category, description, updated_by, updated_at
      FROM system_settings
      ORDER BY category ASC, setting_key ASC
    `);
    return stmt.all() as unknown as ISystemSetting[];
  }

  /**
   * Retrieve settings formatted as key-value map for quick lookup
   */
  static findMap(): ISystemSettingsMap {
    const all = this.findAll();
    const map: ISystemSettingsMap = {};
    for (const item of all) {
      map[item.setting_key] = item.setting_value;
    }
    return map;
  }

  /**
   * Find setting by its unique key
   */
  static findByKey(key: string): ISystemSetting | null {
    const stmt = db.prepare(`
      SELECT id, setting_key, setting_value, category, description, updated_by, updated_at
      FROM system_settings
      WHERE LOWER(setting_key) = LOWER(?)
    `);
    const row = stmt.get(key.trim()) as unknown as ISystemSetting | undefined;
    return row || null;
  }

  /**
   * Upsert a setting key-value pair
   */
  static upsert(
    key: string,
    value: string,
    category: string = 'GENERAL',
    description: string | null = null,
    updatedBy: string | null = null
  ): ISystemSetting {
    const cleanKey = key.trim();
    const existing = this.findByKey(cleanKey);

    if (existing) {
      db.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_by = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(String(value), updatedBy, existing.id);
      return this.findByKey(cleanKey)!;
    } else {
      const id = `setting_${crypto.randomBytes(4).toString('hex')}`;
      db.prepare(`
        INSERT INTO system_settings (
          id, setting_key, setting_value, category, description, updated_by, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(id, cleanKey, String(value), category, description, updatedBy);
      return this.findByKey(cleanKey)!;
    }
  }

  /**
   * Batch update multiple settings atomically
   */
  static updateBatch(
    settingsMap: Record<string, string>,
    updatedBy: string | null = null
  ): ISystemSettingsMap {
    for (const [key, val] of Object.entries(settingsMap)) {
      this.upsert(key, String(val), 'GENERAL', null, updatedBy);
    }
    return this.findMap();
  }
}
