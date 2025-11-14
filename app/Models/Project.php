<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'name',
        'name_da',
        'slug',
        'description',
        'description_da',
        'url',
        'desktop_image',
        'mobile_image',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Scope to get only active projects
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order projects
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    /**
     * Get the localized name based on the current locale
     */
    public function getLocalizedNameAttribute(): string
    {
        $locale = app()->getLocale();

        if ($locale === 'da' && !empty($this->name_da)) {
            return $this->name_da;
        }

        return $this->name;
    }

    /**
     * Get the localized description based on the current locale
     */
    public function getLocalizedDescriptionAttribute(): string
    {
        $locale = app()->getLocale();

        if ($locale === 'da' && !empty($this->description_da)) {
            return $this->description_da;
        }

        return $this->description;
    }
}
