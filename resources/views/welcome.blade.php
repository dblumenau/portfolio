<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{ __('meta.description') }}">
    <title>{{ __('meta.title') }}</title>
    <link rel="icon" type="image/png" href="{{ asset('favicon.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        /* Glassmorphism Scrollbar Styling */
        .glass-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(6, 182, 212, 0.3) rgba(15, 23, 42, 0.2);
        }

        .glass-scrollbar::-webkit-scrollbar {
            width: 8px;
        }

        .glass-scrollbar::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.2);
            backdrop-filter: blur(4px);
            border-radius: 10px;
        }

        .glass-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(6, 182, 212, 0.3);
            backdrop-filter: blur(8px);
            border-radius: 10px;
            border: 1px solid rgba(6, 182, 212, 0.2);
            transition: all 0.3s ease;
        }

        .glass-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(6, 182, 212, 0.5);
            border-color: rgba(6, 182, 212, 0.4);
            box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
        }

        /* Large screen optimization (> 1920px) */
        @media (min-width: 1920px) {
            /* Constrain navigation width */
            nav .container {
                max-width: 1920px;
            }

            /* Constrain the main swiper container wrapper */
            #swiper-container {
                max-width: 1600px;
                margin-left: auto;
                margin-right: auto;
            }

            /* Ensure swiper takes full available width */
            #swiper-coverflow {
                width: 100% !important;
            }

            /* Constrain swiper slide width for better presentation */
            .swiper-slide-responsive {
                max-width: 800px !important;
            }

            /* Constrain grid view for better card sizing */
            #grid-view .grid {
                max-width: 1600px;
            }

            /* Ensure sections don't stretch too wide */
            section .container {
                max-width: 1400px;
            }

            /* Constrain modal content */
            #description-content {
                max-width: 1200px;
            }
        }
    </style>
</head>
<body class="bg-slate-900 text-slate-100">
<!-- Navigation -->
<nav class="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800" x-data="{ mobileMenuOpen: false }">
    <div class="container mx-auto px-4 py-0 flex items-center justify-between relative">
        <!-- Logo -->
        <div class="flex items-center">
            <img src="{{ asset('images/logo.png') }}" alt="{{ __('meta.logo_alt') }}" class="h-12 md:h-14 py-1">
        </div>

        <!-- Mobile: Active Section Indicator -->
        <div class="sm:hidden absolute left-1/2 -translate-x-1/2">
            <span id="mobile-active-section" class="text-slate-300 text-sm font-medium"></span>
        </div>

        <!-- Desktop Nav Links -->
        <div class="hidden sm:flex items-center gap-4 md:gap-6">
            <a href="#projects" class="nav-link text-slate-300 hover:text-cyan-400 transition-all text-sm md:text-base" data-section="projects">{{ __('navigation.portfolio') }}</a>
            <a href="#about" class="nav-link text-slate-300 hover:text-cyan-400 transition-all text-sm md:text-base" data-section="about">{{ __('navigation.about') }}</a>
            <a href="#ai-development" class="nav-link text-slate-300 hover:text-cyan-400 transition-all text-sm md:text-base" data-section="ai-development">{{ __('navigation.ai_supervision') }}</a>
            <a href="#contact" class="nav-link text-slate-300 hover:text-cyan-400 transition-all text-sm md:text-base" data-section="contact">{{ __('navigation.contact') }}</a>
            <a href="https://blog.danishdave.com" target="_blank" rel="noopener noreferrer" class="nav-link blog-link text-[#C8102E] hover:text-[#C8102E] transition-all text-sm md:text-base">{{ __('navigation.blog') }}</a>

            <!-- View Toggle Button - Desktop -->
            <button id="view-toggle" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 transition-all duration-300 hover:scale-105">
                <svg id="toggle-icon-coverflow" class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
                </svg>
                <svg id="toggle-icon-grid" class="w-4 h-4 text-cyan-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                </svg>
                <span id="toggle-text" class="text-slate-100 font-medium text-xs md:text-sm">{{ __('projects.grid_view') }}</span>
            </button>

            <!-- Language Switcher Dropdown - Desktop -->
            <div class="relative ml-2" x-data="{ open: false }" @click.away="open = false">
                <button @click="open = !open" class="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-all text-xs md:text-sm font-medium">
                    <span>{{ app()->getLocale() === 'en' ? '🇬🇧 EN' : '🇩🇰 DA' }}</span>
                    <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': open }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>

                <!-- Dropdown Menu -->
                <div x-show="open"
                     x-transition:enter="transition ease-out duration-100"
                     x-transition:enter-start="transform opacity-0 scale-95"
                     x-transition:enter-end="transform opacity-100 scale-100"
                     x-transition:leave="transition ease-in duration-75"
                     x-transition:leave-start="transform opacity-100 scale-100"
                     x-transition:leave-end="transform opacity-0 scale-95"
                     class="absolute right-0 mt-2 w-32 rounded-lg bg-slate-800 shadow-lg ring-1 ring-slate-700 z-50"
                     style="display: none;">
                    <div class="py-1">
                        <a href="/en" class="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-cyan-400 transition-colors {{ app()->getLocale() === 'en' ? 'bg-slate-700/50 text-cyan-400' : '' }}">
                            <span>🇬🇧</span>
                            <span>English</span>
                        </a>
                        <a href="/da" class="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-cyan-400 transition-colors {{ app()->getLocale() === 'da' ? 'bg-slate-700/50 text-cyan-400' : '' }}">
                            <span>🇩🇰</span>
                            <span>Dansk</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile: Blog Link + Burger Button -->
        <div class="sm:hidden flex items-center gap-4">
            <a href="https://blog.danishdave.com" target="_blank" rel="noopener noreferrer" class="text-[#C8102E] hover:text-[#C8102E] transition-all text-sm font-medium">{{ __('navigation.blog') }}</a>

            <!-- Burger Menu Button -->
            <button @click="mobileMenuOpen = !mobileMenuOpen" class="flex items-center justify-center w-9 h-9 text-slate-300 hover:text-cyan-400 transition-colors" aria-label="{{ __('navigation.menu') }}">
                <!-- Hamburger Icon -->
                <svg x-show="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
                <!-- Close Icon -->
                <svg x-show="mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display: none;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    </div>

    <!-- Mobile Burger Menu Overlay -->
    <div x-show="mobileMenuOpen"
         x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="opacity-0 transform translate-x-full"
         x-transition:enter-end="opacity-100 transform translate-x-0"
         x-transition:leave="transition ease-in duration-200"
         x-transition:leave-start="opacity-100 transform translate-x-0"
         x-transition:leave-end="opacity-0 transform translate-x-full"
         class="sm:hidden fixed inset-0 z-60 bg-slate-900/98 backdrop-blur-md"
         style="display: none; position: fixed !important; top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(15, 23, 42, 0.98) !important; backdrop-filter: blur(12px) !important;"
         @click.self="mobileMenuOpen = false">

        <div class="flex flex-col h-full pt-20 px-6 pb-6">
            <!-- Close Button -->
            <button @click="mobileMenuOpen = false"
                    class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-colors rounded-full hover:bg-slate-800/50"
                    aria-label="{{ __('navigation.close') }}">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>

            <!-- Navigation Links -->
            <div class="flex flex-col gap-6 mb-8">
                <a href="#projects"
                   @click="mobileMenuOpen = false"
                   class="nav-link mobile-nav-link text-slate-300 hover:text-cyan-400 transition-all text-lg font-medium py-2 border-b border-slate-800"
                   data-section="projects">
                    {{ __('navigation.portfolio') }}
                </a>
                <a href="#about"
                   @click="mobileMenuOpen = false"
                   class="nav-link mobile-nav-link text-slate-300 hover:text-cyan-400 transition-all text-lg font-medium py-2 border-b border-slate-800"
                   data-section="about">
                    {{ __('navigation.about') }}
                </a>
                <a href="#ai-development"
                   @click="mobileMenuOpen = false"
                   class="nav-link mobile-nav-link text-slate-300 hover:text-cyan-400 transition-all text-lg font-medium py-2 border-b border-slate-800"
                   data-section="ai-development">
                    {{ __('navigation.ai_supervision') }}
                </a>
                <a href="#contact"
                   @click="mobileMenuOpen = false"
                   class="nav-link mobile-nav-link text-slate-300 hover:text-cyan-400 transition-all text-lg font-medium py-2 border-b border-slate-800"
                   data-section="contact">
                    {{ __('navigation.contact') }}
                </a>
            </div>

            <!-- View Toggle Button -->
            <div class="mb-8">
                <div class="text-slate-500 text-xs uppercase tracking-wider mb-3">View Mode</div>
                <button id="view-toggle-mobile" class="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 transition-all">
                    <div class="flex items-center gap-3">
                        <svg id="toggle-icon-coverflow-mobile" class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
                        </svg>
                        <svg id="toggle-icon-grid-mobile" class="w-5 h-5 text-cyan-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                        </svg>
                        <span id="toggle-text-mobile" class="text-slate-100 font-medium">{{ __('projects.grid_view') }}</span>
                    </div>
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>

            <!-- Language Switcher -->
            <div class="mb-8">
                <div class="text-slate-500 text-xs uppercase tracking-wider mb-3">Language</div>
                <div class="flex flex-col gap-2">
                    <a href="/en" class="flex items-center justify-between px-4 py-3 rounded-lg transition-colors {{ app()->getLocale() === 'en' ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-400' : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800' }}">
                        <div class="flex items-center gap-3">
                            <span class="text-xl">🇬🇧</span>
                            <span class="font-medium">English</span>
                        </div>
                        @if(app()->getLocale() === 'en')
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        @endif
                    </a>
                    <a href="/da" class="flex items-center justify-between px-4 py-3 rounded-lg transition-colors {{ app()->getLocale() === 'da' ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-400' : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800' }}">
                        <div class="flex items-center gap-3">
                            <span class="text-xl">🇩🇰</span>
                            <span class="font-medium">Dansk</span>
                        </div>
                        @if(app()->getLocale() === 'da')
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        @endif
                    </a>
                </div>
            </div>
        </div>
    </div>
</nav>

<!-- Hero Section with Swiper -->
<section id="projects" class="min-h-screen relative bg-gradient-to-b from-slate-950 to-slate-900 pt-14">
    <!-- Swiper Carousel -->
    <div id="swiper-container" class="relative w-full h-screen flex items-center justify-center">
        <!-- Coverflow Swiper -->
        <swiper-container
            id="swiper-coverflow"
            class="w-full swiper-responsive"
            effect="coverflow"
            grab-cursor="true"
            centered-slides="true"
            slides-per-view="auto"
            coverflow-effect-modifier="1"
            coverflow-effect-slide-shadows="false"
            autoplay-delay="15000"
            autoplay-disable-on-interaction="false"
            loop="true"
            initial-slide="0"
            navigation="true"
            pagination="true"
            pagination-clickable="true"
        >
            @foreach ($projects as $project)
                <swiper-slide class="swiper-slide-responsive">
                    <div class="glass rounded-2xl p-6 md:p-10 h-full flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/10">
                        <!-- Project Image -->
                        <div class="relative mb-4 md:mb-6 flex-shrink-0">
                            <picture class="cursor-zoom-in" onclick="openLightbox('{{ asset($project->desktop_image) }}', '{{ $project->localized_name }}');">
                                <!-- Mobile image for small screens -->
                                <source
                                    media="(max-width: 768px)"
                                    srcset="{{ asset($project->mobile_image) }}"
                                >
                                <!-- Desktop image for larger screens -->
                                <img
                                    src="{{ asset($project->desktop_image) }}"
                                    alt="{{ $project->localized_name }}"
                                    class="w-full max-h-[350px] md:h-80 md:max-h-none md:object-cover object-contain rounded-xl"
                                >
                            </picture>
                            <!-- Overlay gradient -->
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent rounded-xl pointer-events-none"></div>
                        </div>

                        <!-- Project Info -->
                        <div class="flex-grow flex flex-col min-h-0">
                            <!-- Visit Link -->
                            <a href="{{ $project->url }}" target="_blank" rel="noopener noreferrer" class="inline-block mb-2 md:mb-3 flex-shrink-0">
                                <div class="flex items-center text-cyan-400 font-medium text-sm md:text-base hover:text-cyan-300 transition-colors">
                                    <span>{{ __('projects.visit_project') }}</span>
                                    <svg class="w-4 h-4 md:w-5 md:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                    </svg>
                                </div>
                            </a>

                            <h3 class="text-xl md:text-3xl font-bold text-cyan-400 mb-2 md:mb-4 break-words flex-shrink-0">
                                {{ $project->localized_name }}
                            </h3>
                            <p class="text-slate-300 text-sm md:text-lg leading-relaxed break-words overflow-y-auto glass-scrollbar">
                                {{ $project->localized_description }}
                            </p>
                        </div>
                    </div>
                </swiper-slide>
            @endforeach
        </swiper-container>

        <!-- Grid View -->
        <div id="grid-view" class="w-full hidden px-4 md:px-8 pt-8 pb-16">
            <div class="grid grid-cols-2 gap-3 md:gap-4 max-w-7xl mx-auto">
                @foreach ($projects as $project)
                    <div class="project-card cursor-pointer"
                         data-project-name="{{ $project->localized_name }}"
                         data-project-description="{{ $project->localized_description }}"
                         data-project-url="{{ $project->url }}"
                         data-project-desktop-image="{{ asset($project->desktop_image) }}"
                         data-project-mobile-image="{{ asset($project->mobile_image) }}">
                        <div class="glass rounded-xl md:rounded-2xl p-3 md:p-6 h-full flex flex-col transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-y-auto glass-scrollbar">
                            <!-- Project Image -->
                            <div class="relative mb-2 md:mb-4 flex-shrink-0">
                                <picture>
                                    <!-- Mobile image for small screens -->
                                    <source
                                        media="(max-width: 768px)"
                                        srcset="{{ asset($project->mobile_image) }}"
                                    >
                                    <!-- Desktop image for larger screens -->
                                    <img
                                        src="{{ asset($project->desktop_image) }}"
                                        alt="{{ $project->localized_name }}"
                                        class="w-full h-32 md:h-48 object-contain rounded-lg"
                                    >
                                </picture>
                                <!-- Overlay gradient -->
                                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent rounded-lg pointer-events-none"></div>
                            </div>

                            <!-- Project Info -->
                            <div class="flex-grow">
                                <h3 class="text-sm md:text-xl font-bold text-cyan-400 mb-1 md:mb-2 break-words">
                                    {{ $project->localized_name }}
                                </h3>
                                <p class="text-slate-300 text-xs md:text-sm leading-relaxed break-words line-clamp-3 md:line-clamp-4">
                                    {{ $project->localized_description }}
                                </p>
                            </div>

                            <!-- Mobile Tap Indicator -->
                            <div class="mt-3 md:hidden">
                                <div class="flex items-center justify-center gap-2 bg-cyan-400/10 border border-cyan-400/30 rounded-lg px-3 py-2 text-cyan-400 text-xs font-medium">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                                    </svg>
                                    <span>{{ __('projects.tap_for_details') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</section>

<!-- About Section -->
<section id="about" class="py-8 md:py-16 bg-slate-900">
    <div class="container mx-auto px-4 max-w-5xl">
        <div class="glass rounded-2xl p-8 md:p-12">
            <div class="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
                <!-- Profile Image -->
                <div class="flex-shrink-0 md:mt-22">
                    <img
                        src="{{ asset('images/david.jpeg') }}"
                        alt="{{ __('about.image_alt') }}"
                        class="w-48 md:w-64 rounded-2xl border-2 border-cyan-400/30 shadow-lg shadow-cyan-500/20"
                    >
                </div>

                <!-- Text Content -->
                <div class="flex-1">
                    <h2 class="text-4xl md:text-5xl font-bold text-center md:text-left mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        {{ __('about.heading') }}
                    </h2>
                    <div class="space-y-6 text-slate-300 text-lg leading-relaxed">
                        <p>{!! __('about.paragraph_1') !!}</p>
                        <p>{!! __('about.paragraph_2') !!}</p>
                        <p>{!! __('about.paragraph_3') !!}</p>
                        <p>{{ __('about.paragraph_4') }}</p>
                        <p class="text-xs">{{ __('about.paragraph_5') }}</p>
                        <p>{!! __('about.paragraph_6') !!}</p>
                        <p>{!! __('about.paragraph_7') !!}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- AI Supervision & Architecture Section -->
<section id="ai-development" class="py-8 md:py-16 bg-slate-950">
    <div class="container mx-auto px-4 max-w-6xl">
        <h2 class="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {{ __('ai.heading') }}
        </h2>

        <div class="space-y-8">
            <!-- Intro -->
            <div class="text-center max-w-4xl mx-auto mb-12">
                <p class="text-slate-300 text-lg leading-relaxed">
                    {{ __('ai.intro_paragraph_1') }}
                </p>
                <p class="text-slate-300 text-lg leading-relaxed">{{ __('ai.intro_paragraph_2') }}
                    <br><br>
                    {!! __('ai.intro_paragraph_3') !!}
                    <br><br>{!! __('ai.intro_paragraph_4') !!}
                </p>
            </div>

            <!-- Code Blocks Grid -->
            <div class="grid md:grid-cols-2 gap-6 md:gap-8">
                <!-- First Prompt -->
                <div class="space-y-4">
                    <h3 class="text-xl font-semibold text-cyan-400">{{ __('ai.initial_prompt_heading') }}</h3>
                    <div class="glass rounded-xl p-6">
                            <pre class="text-xs md:text-sm text-cyan-100 font-mono leading-relaxed whitespace-pre-wrap break-words"><code>I have created several development and product projects,
DJ Forge /Users/davidblumenau/projects/scratch/djforge
Panel Forge /Users/davidblumenau/projects/scratch/dreamatorium - ignore that the repo is called dreamatorium
Swift Danish /Users/davidblumenau/projects/scratch/swiftdanish
a small single page website called
calendar.danishdave.com (visit that)
and I host a blog you can see at
blog.danishdave.com - visit that too

I want to make a simple portfolio / redirecting path website that showcases those websites that shows visitors to the main parent domain danishdave.com a simple page with links to those projects and a brief
description of each. It should use a swiper.js showcase similar to how its done on panel forge home page and when you click each image it takes you to that website. Each image will be 1920x1080 and 375px
(and iphone height) as preview screenshots of those homepages. Just use palceholder images for now. The swiper will use the relevant image either the desktop or the mobile one depending on the screen size
that is viewing the portfolio site.
You can gather information about each project from their readme files to do a write up of each one (the blog and calendar sites can be described briefly as well).

We will do it in laravel and use tailwind for the styling. You can install whatever you need from npm as well. Ensure that you use context7 to understand how tailwind 4 works because it has changed
significantly from tailwind 3.</code></pre>
                    </div>
                </div>

                <!-- Second Prompt -->
                <div class="space-y-4">
                    <h3 class="text-xl font-semibold text-cyan-400">{{ __('ai.deployment_prompt_heading') }}</h3>
                    <div class="glass rounded-xl p-6">
                            <pre class="text-xs md:text-sm text-cyan-100 font-mono leading-relaxed whitespace-pre-wrap break-words"><code>Please use my github cli tool (gh to make a new repo called portfolio (if there is already one then rename that one so that this repo becomes the portfolio one) - the repo can be public.
See this directory.  /Users/davidblumenau/projects/scratch/dreamatorium/
This is a standard laravel project, and that is a nativephp / regular laravel hybrid project.
That project (dreamatorium) is deployed to my hetzner vps in a really nice way with github actions running and compiling the app building a docker image then deploying that app to the hetzner vps, all upon pushing a tag labelled web-something. In this case, I'm happy for it to run that pipeline instead when you push something with the tag v-something eg v-1.0.1 or v-1.1.0 or v-2.0.0 etc.
I want to replicate that same set up for this current project.
You can ssh into the hetzner server by using bash and saying ssh &lt;redacted&gt;@&lt;redacted&gt;
It's a simple vps that only I use so I am fine if you need to do anything sudo on it, in which case I can give you the sudo password once you need it.
I have already made an a record to point to the server with the url swiftdanish.danishdave.com but you will still need to set up the nginx virtual host thingy.</code></pre>
                    </div>
                </div>
            </div>

            <!-- Closing Statement -->
            <div class="text-center max-w-4xl mx-auto mt-12">
                <p class="text-slate-400 text-base leading-relaxed">
                    {{ __('ai.closing_statement') }}
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Contact Section -->
<section id="contact" class="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
    <div class="container mx-auto px-4 max-w-4xl">
        <div class="text-center">
            <h2 class="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {{ __('contact.heading') }}
            </h2>
            <p class="text-slate-300 text-lg mb-12 max-w-2xl mx-auto">
                {{ __('contact.intro') }}
            </p>

            <div class="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <!-- Email -->
                <div class="relative group flex flex-col">
                    <a href="mailto:dblumenau@gmail.com" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span class="text-slate-100 font-medium">{{ __('contact.email') }}</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        {{ __('contact.email_tooltip') }}
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        {{ __('contact.email_tooltip') }}
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>

                <!-- GitHub with tooltip -->
                <div class="relative group flex flex-col">
                    <a href="https://github.com/dblumenau" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">{{ __('contact.github') }}</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        {{ __('contact.github_tooltip') }}
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        {{ __('contact.github_tooltip') }}
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>

                <!-- LinkedIn -->
                <div class="relative group flex flex-col">
                    <a href="https://www.linkedin.com/in/dblumenau/" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">{{ __('contact.linkedin') }}</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        {{ __('contact.linkedin_tooltip') }}
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        {{ __('contact.linkedin_tooltip') }}
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>

                <!-- Insta -->
                <div class="relative group flex flex-col">
                    <a href="https://www.instagram.com/dblumenau" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">{{ __('contact.instagram') }}</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        {{ __('contact.instagram_tooltip') }}
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        {{ __('contact.instagram_tooltip') }}
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>

                <!-- TikTok -->
                <div class="relative group flex flex-col">
                    <a href="https://www.tiktok.com/@dblumenau" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">{{ __('contact.tiktok') }}</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        {{ __('contact.tiktok_tooltip') }}
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        {{ __('contact.tiktok_tooltip') }}
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>

                <!-- Reddit -->
                <div class="relative group flex flex-col">
                    <a href="https://www.reddit.com/user/gothika4622" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">{{ __('contact.reddit') }}</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        {{ __('contact.reddit_tooltip') }}
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        {{ __('contact.reddit_tooltip') }}
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Footer -->
<footer class="py-8 bg-slate-950">
    <div class="container mx-auto px-4 text-center text-slate-400">
        <p>&copy; {{ date('Y') }} Danish Dave. {{ __('common.built_with') }}</p><br>
        <p class="text-xs">{!! __('common.swiftie_bonus') !!}</p>
        <p class="text-xs"></p>

    </div>
</footer>

<!-- Image Lightbox Modal -->
<div id="lightbox" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90 p-4" onclick="closeLightbox()">
    <button
        onclick="closeLightbox()"
        class="absolute top-4 right-4 z-10 text-white hover:text-cyan-400 transition-colors duration-200 p-2"
        aria-label="{{ __('common.close_lightbox') }}"
    >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
    </button>
    <img
        id="lightbox-image"
        src=""
        alt=""
        class="max-h-full max-w-full object-contain rounded-lg"
        onclick="event.stopPropagation()"
    >
</div>

<!-- Description Lightbox Modal -->
<div id="description-lightbox" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/0 p-4 transition-all duration-300" onclick="closeDescriptionLightbox()">
    <div id="description-content" class="glass rounded-2xl p-6 md:p-10 max-w-4xl w-full max-h-[90vh] overflow-y-auto glass-scrollbar transform scale-95 opacity-0 transition-all duration-300" onclick="event.stopPropagation()">
        <button
            onclick="closeDescriptionLightbox()"
            class="sticky md:absolute top-2 md:top-4 right-2 md:right-4 ml-auto flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/95 md:bg-slate-800/80 backdrop-blur-md border border-slate-700/50 text-slate-300 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-200 shadow-lg hover:shadow-cyan-500/20 z-10 mb-4 md:mb-0"
            aria-label="{{ __('common.close_description') }}"
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>

        <!-- Project Image -->
        <div class="relative mb-6">
            <picture>
                <source
                    id="description-image-mobile-source"
                    media="(max-width: 768px)"
                    srcset=""
                >
                <img
                    id="description-image"
                    src=""
                    alt=""
                    class="w-full h-auto max-h-[600px] md:max-h-96 object-contain rounded-xl"
                >
            </picture>
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent rounded-xl pointer-events-none"></div>
        </div>

        <h3 id="description-title" class="text-2xl md:text-4xl font-bold text-cyan-400 mb-4 pr-8">
        </h3>

        <p id="description-text" class="text-slate-300 text-base md:text-lg leading-relaxed mb-6">
        </p>

        <a id="description-link" href="#" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105">
            <span>{{ __('projects.visit_project') }}</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
            </svg>
        </a>
    </div>
</div>

<script>
    // View mode state
    let currentView = localStorage.getItem('portfolioView') || 'coverflow';
    let coverflowSwiper, gridView;

    // Translation strings
    const translations = {
        gridView: '{{ __('projects.grid_view') }}',
        coverflowView: '{{ __('projects.coverflow_view') }}',
        sections: {
            'projects': '{{ __('navigation.portfolio') }}',
            'about': '{{ __('navigation.about') }}',
            'ai-development': '{{ __('navigation.ai_supervision') }}',
            'contact': '{{ __('navigation.contact') }}'
        }
    };

    // Initialize views
    document.addEventListener('DOMContentLoaded', function () {
        coverflowSwiper = document.getElementById('swiper-coverflow');
        gridView = document.getElementById('grid-view');

        console.log('Projects swiper initialized');
        console.log('What are you doing in the dev tools of my portfolio website you sneaky tricky hobbit? :)');

        // Show the correct view based on saved preference
        if (currentView === 'grid') {
            updateUIForGrid();
            enableGridClickHandlers();
        } else {
            updateUIForCoverflow();
        }

        // Toggle button functionality (both desktop and mobile)
        const toggleButton = document.getElementById('view-toggle');
        const toggleButtonMobile = document.getElementById('view-toggle-mobile');

        const handleToggle = function() {
            if (currentView === 'coverflow') {
                switchToGridView();
            } else {
                switchToCoverflowView();
            }
        };

        if (toggleButton) {
            toggleButton.addEventListener('click', handleToggle);
        }
        if (toggleButtonMobile) {
            toggleButtonMobile.addEventListener('click', handleToggle);
        }

        // Active section highlighting
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.getAttribute('id');

                    // Remove active class from all links
                    navLinks.forEach(link => {
                        link.classList.remove('active-nav');
                    });

                    // Add active class to current link
                    const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active-nav');
                    }

                    // Update mobile active section indicator
                    const mobileIndicator = document.getElementById('mobile-active-section');
                    if (mobileIndicator && translations.sections[sectionId]) {
                        mobileIndicator.textContent = translations.sections[sectionId];
                    }
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    });

    // UI update functions
    function updateUIForGrid() {
        const toggleText = document.getElementById('toggle-text');
        const toggleTextMobile = document.getElementById('toggle-text-mobile');
        const iconCoverflow = document.getElementById('toggle-icon-coverflow');
        const iconGrid = document.getElementById('toggle-icon-grid');
        const iconCoverflowMobile = document.getElementById('toggle-icon-coverflow-mobile');
        const iconGridMobile = document.getElementById('toggle-icon-grid-mobile');
        const swiperContainer = document.getElementById('swiper-container');

        // Update toggle button (desktop)
        toggleText.textContent = translations.coverflowView;
        iconCoverflow.classList.remove('hidden');
        iconGrid.classList.add('hidden');

        // Update toggle button (mobile - burger menu)
        if (toggleTextMobile) toggleTextMobile.textContent = translations.coverflowView;
        iconCoverflowMobile.classList.remove('hidden');
        iconGridMobile.classList.add('hidden');

        // Change container alignment and height for grid view
        swiperContainer.classList.remove('items-center', 'justify-center', 'h-screen');
        swiperContainer.classList.add('items-start', 'min-h-screen');

        // Toggle visibility
        coverflowSwiper.classList.add('hidden');
        gridView.classList.remove('hidden');
    }

    function updateUIForCoverflow() {
        const toggleText = document.getElementById('toggle-text');
        const toggleTextMobile = document.getElementById('toggle-text-mobile');
        const iconCoverflow = document.getElementById('toggle-icon-coverflow');
        const iconGrid = document.getElementById('toggle-icon-grid');
        const iconCoverflowMobile = document.getElementById('toggle-icon-coverflow-mobile');
        const iconGridMobile = document.getElementById('toggle-icon-grid-mobile');
        const swiperContainer = document.getElementById('swiper-container');

        // Update toggle button (desktop)
        toggleText.textContent = translations.gridView;
        iconCoverflow.classList.add('hidden');
        iconGrid.classList.remove('hidden');

        // Update toggle button (mobile - burger menu)
        if (toggleTextMobile) toggleTextMobile.textContent = translations.gridView;
        iconCoverflowMobile.classList.add('hidden');
        iconGridMobile.classList.remove('hidden');

        // Restore center alignment and fixed height for coverflow view
        swiperContainer.classList.remove('items-start', 'min-h-screen');
        swiperContainer.classList.add('items-center', 'justify-center', 'h-screen');

        // Toggle visibility
        coverflowSwiper.classList.remove('hidden');
        gridView.classList.add('hidden');
    }

    // View switching functions
    function switchToGridView() {
        currentView = 'grid';
        localStorage.setItem('portfolioView', 'grid');
        updateUIForGrid();
        enableGridClickHandlers();
    }

    function switchToCoverflowView() {
        currentView = 'coverflow';
        localStorage.setItem('portfolioView', 'coverflow');
        updateUIForCoverflow();
        disableGridClickHandlers();
    }

    function enableGridClickHandlers() {
        const projectCards = gridView.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            card.addEventListener('click', handleGridCardClick);
        });
    }

    function disableGridClickHandlers() {
        const projectCards = gridView.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            card.removeEventListener('click', handleGridCardClick);
        });
    }

    function handleGridCardClick(event) {
        event.preventDefault();
        const card = event.currentTarget;
        const projectName = card.getAttribute('data-project-name');
        const projectDescription = card.getAttribute('data-project-description');
        const projectUrl = card.getAttribute('data-project-url');
        const desktopImage = card.getAttribute('data-project-desktop-image');
        const mobileImage = card.getAttribute('data-project-mobile-image');

        openDescriptionLightbox(projectName, projectDescription, projectUrl, desktopImage, mobileImage);
    }

    // Description lightbox functions
    function openDescriptionLightbox(title, description, url, desktopImageSrc, mobileImageSrc) {
        const lightbox = document.getElementById('description-lightbox');
        const content = document.getElementById('description-content');
        const titleElement = document.getElementById('description-title');
        const textElement = document.getElementById('description-text');
        const linkElement = document.getElementById('description-link');
        const imageElement = document.getElementById('description-image');
        const mobileSourceElement = document.getElementById('description-image-mobile-source');

        titleElement.textContent = title;
        textElement.textContent = description;
        linkElement.href = url;
        imageElement.src = desktopImageSrc;
        imageElement.alt = title;
        mobileSourceElement.srcset = mobileImageSrc;

        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');

        // Trigger animation after a brief delay to ensure display changes apply first
        setTimeout(() => {
            lightbox.classList.remove('bg-black/0');
            lightbox.classList.add('bg-black/90');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Prevent body scroll when lightbox is open
        document.documentElement.classList.add('overflow-hidden');
        document.body.classList.add('overflow-hidden');
    }

    function closeDescriptionLightbox() {
        const lightbox = document.getElementById('description-lightbox');
        const content = document.getElementById('description-content');

        // Trigger close animation
        lightbox.classList.remove('bg-black/90');
        lightbox.classList.add('bg-black/0');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');

        // Wait for animation to complete before hiding
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');

            // Restore body scroll
            document.documentElement.classList.remove('overflow-hidden');
            document.body.classList.remove('overflow-hidden');
        }, 300); // Match the transition duration
    }

    // Lightbox functions
    function openLightbox(imageSrc, imageAlt) {
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightbox-image');

        lightboxImage.src = imageSrc;
        lightboxImage.alt = imageAlt;

        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');

        // Prevent body scroll when lightbox is open
        document.documentElement.classList.add('overflow-hidden');
        document.body.classList.add('overflow-hidden');
    }

    function closeLightbox() {
        const lightbox = document.getElementById('lightbox');

        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');

        // Restore body scroll
        document.documentElement.classList.remove('overflow-hidden');
        document.body.classList.remove('overflow-hidden');
    }

    // Close lightboxes with Escape key
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeLightbox();
            closeDescriptionLightbox();
        }
    });
</script>
</body>
</html>
