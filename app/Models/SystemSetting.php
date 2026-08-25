<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Default system settings and their fallback values.
     *
     * @var array<string, string>
     */
    public const DEFAULTS = [
        'app_name' => 'DocuLink',
        'support_email' => 'support@doculink.test',
        'allow_registration' => '1',
        'maintenance_mode' => '0',
        'ai_reports_enabled' => '0',
    ];

    /**
     * Retrieve all settings merged over the defaults.
     *
     * @return array<string, string>
     */
    public static function values(): array
    {
        return array_merge(static::DEFAULTS, static::query()->pluck('value', 'key')->all());
    }

    public static function getValue(string $key): ?string
    {
        return static::values()[$key] ?? null;
    }

    /**
     * Persist a batch of settings.
     *
     * @param  array<string, string>  $values
     */
    public static function setMany(array $values): void
    {
        foreach ($values as $key => $value) {
            static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
