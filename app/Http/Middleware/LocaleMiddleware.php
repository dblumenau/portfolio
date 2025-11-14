<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class LocaleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->route('locale');

        // Validate locale
        if (!in_array($locale, ['en', 'da'])) {
            abort(404);
        }

        // Set application locale
        App::setLocale($locale);

        // Store locale preference in session
        session(['locale' => $locale]);

        return $next($request);
    }
}
