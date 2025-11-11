<?php

namespace App\Http\Controllers;

use App\Models\Project;

class HomeController extends Controller
{
    public function index()
    {
        $projects = Project::active()->ordered()->get();

        return view('welcome', compact('projects'));
    }
}
