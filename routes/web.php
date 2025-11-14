<?php

use App\Http\Controllers\HomeController;
use App\Http\Middleware\LocaleMiddleware;
use Illuminate\Support\Facades\Route;

// Root route - detect browser language and redirect
Route::get('/', function () {
    $locale = session('locale');

    // If no session locale, detect from browser
    if (!$locale) {
        $acceptLanguage = request()->header('Accept-Language');
        // Check if Danish is preferred
        if ($acceptLanguage && str_contains(strtolower($acceptLanguage), 'da')) {
            $locale = 'da';
        } else {
            $locale = 'en';
        }
    }

    return redirect("/$locale");
});

// Locale-prefixed routes
Route::prefix('{locale}')->middleware(LocaleMiddleware::class)->group(function () {
    Route::get('/', [HomeController::class, 'index'])->name('home');
});
