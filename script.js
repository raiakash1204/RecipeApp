// Global variables
let currentFilter = 'all';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentRecipe = null;
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// API
const API_KEY = '1';
const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadFeaturedRecipes();
    updateFavoriteCount();
    setupEventListeners();
});

function initializeApp() {
    // Set dark mode
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.getElementById('dark-mode-icon').className = 'fas fa-sun text-lg';
    }
    
    // Initialize letter navigation
    initializeLetterNav();
    
    // Load favorites
    updateFavoriteCount();
}

function setupEventListeners() {
    // Search on Enter key
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchRecipes();
        }
    });

    // Close modal on outside click
    document.getElementById('recipe-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// Navigation functions
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    
    // Show selected view
    document.getElementById(viewName + '-view').classList.remove('hidden');
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('text-gray-700', 'dark:text-gray-300');
    });
    
    // Handle specific view logic
    if (viewName === 'all-recipes') {
        loadRecipesByLetter('a');
    } else if (viewName === 'favorites') {
        loadFavorites();
    }
}

// Dark mode functions
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark');
    
    const icon = document.getElementById('dark-mode-icon');
    icon.className = isDarkMode ? 'fas fa-sun text-lg' : 'fas fa-moon text-lg';
    
    localStorage.setItem('darkMode', isDarkMode);
}

// Diet filter toggle functions
function toggleDietFilter() {
    const toggle = document.getElementById('diet-toggle');
    const toggleBg = toggle.parentElement.querySelector('.toggle-bg');
    const dot = toggleBg.querySelector('.toggle-dot');
    const leafIcon = dot.querySelector('i');
    
    if (toggle.checked) {
        currentFilter = 'vegetarian';
        toggleBg.classList.remove('bg-gray-300', 'dark:bg-gray-600');
        toggleBg.classList.add('bg-gradient-to-r', 'from-green-400', 'to-green-500');
        dot.classList.add('translate-x-8');
        leafIcon.classList.remove('text-gray-400');
        leafIcon.classList.add('text-green-600');
    } else {
        currentFilter = 'all';
        toggleBg.classList.add('bg-gray-300', 'dark:bg-gray-600');
        toggleBg.classList.remove('bg-gradient-to-r', 'from-green-400', 'to-green-500');
        dot.classList.remove('translate-x-8');
        leafIcon.classList.add('text-gray-400');
        leafIcon.classList.remove('text-green-600');
    }
    
    // Re-search with new filter
    const searchInput = document.getElementById('search-input');
    if (searchInput.value.trim()) {
        searchRecipes();
    } else {
        loadFeaturedRecipes();
    }
}

function toggleDietFilterAll() {
    const toggle = document.getElementById('diet-toggle-all');
    const toggleBg = toggle.parentElement.querySelector('.toggle-bg');
    const dot = toggleBg.querySelector('.toggle-dot');
    const leafIcon = dot.querySelector('i');
    
    if (toggle.checked) {
        currentFilter = 'vegetarian';
        toggleBg.classList.remove('bg-gray-300', 'dark:bg-gray-600');
        toggleBg.classList.add('bg-gradient-to-r', 'from-green-400', 'to-green-500');
        dot.classList.add('translate-x-8');
        leafIcon.classList.remove('text-gray-400');
        leafIcon.classList.add('text-green-600');
    } else {
        currentFilter = 'all';
        toggleBg.classList.add('bg-gray-300', 'dark:bg-gray-600');
        toggleBg.classList.remove('bg-gradient-to-r', 'from-green-400', 'to-green-500');
        dot.classList.remove('translate-x-8');
        leafIcon.classList.add('text-gray-400');
        leafIcon.classList.remove('text-green-600');
    }
    
    // Get current active letter
    const activeLetter = document.querySelector('.letter-btn.active')?.textContent.toLowerCase() || 'a';
    loadRecipesByLetter(activeLetter);
}

// API functions
async function searchRecipes() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        let recipes = data.meals || [];
        recipes = filterRecipes(recipes);
        
        displayRecipes(recipes, 'search-results');
    } catch (error) {
        console.error('Error searching recipes:', error);
        showError('Failed to search recipes. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function loadFeaturedRecipes() {
    showLoading(true);
    
    try {
        // Load random featured recipes
        const featuredRecipes = [];
        const letters = ['a', 'b', 'c', 'd', 'e'];
        
        for (const letter of letters) {
            const response = await fetch(`${BASE_URL}/search.php?f=${letter}`);
            const data = await response.json();
            if (data.meals) {
                featuredRecipes.push(...data.meals.slice(0, 3));
            }
        }
        
        // Shuffle and limit results
        const shuffled = featuredRecipes.sort(() => 0.5 - Math.random());
        let recipes = shuffled.slice(0, 12);
        recipes = filterRecipes(recipes);
        
        displayRecipes(recipes, 'search-results');
    } catch (error) {
        console.error('Error loading featured recipes:', error);
        showError('Failed to load recipes. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function loadRecipesByLetter(letter) {
    showLoading(true);
    
    // Update active letter button
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[onclick="loadRecipesByLetter('${letter}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    try {
        const response = await fetch(`${BASE_URL}/search.php?f=${letter}`);
        const data = await response.json();
        
        let recipes = data.meals || [];
        recipes = filterRecipes(recipes);
        recipes.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
        
        displayRecipes(recipes, 'all-recipes-grid');
    } catch (error) {
        console.error('Error loading recipes by letter:', error);
        showError('Failed to load recipes. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function getRecipeDetails(id) {
    try {
        const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
        const data = await response.json();
        return data.meals ? data.meals[0] : null;
    } catch (error) {
        console.error('Error getting recipe details:', error);
        return null;
    }
}

// Filter recipes based on vegetarian/non-vegetarian
function filterRecipes(recipes) {
    if (currentFilter === 'all') return recipes;
    
    return recipes.filter(recipe => {
        const isVegetarian = isRecipeVegetarian(recipe);
        return currentFilter === 'vegetarian' ? isVegetarian : !isVegetarian;
    });
}

function isRecipeVegetarian(recipe) {
    const nonVegIngredients = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'bacon', 'ham', 'turkey', 'duck', 'meat', 'seafood'];
    const ingredients = getRecipeIngredients(recipe).join(' ').toLowerCase();
    const category = recipe.strCategory.toLowerCase();
    
    return !nonVegIngredients.some(ingredient => 
        ingredients.includes(ingredient) || category.includes(ingredient)
    );
}

function getRecipeIngredients(recipe) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = recipe[`strIngredient${i}`];
        if (ingredient && ingredient.trim()) {
            ingredients.push(ingredient.trim());
        }
    }
    return ingredients;
}

// Display functions
function displayRecipes(recipes, containerId) {
    const container = document.getElementById(containerId);
    
    if (!recipes || recipes.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16">
                <i class="fas fa-search text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <h3 class="text-2xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No recipes found</h3>
                <p class="text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recipes.map(recipe => createRecipeCard(recipe)).join('');
}

function createRecipeCard(recipe) {
    const isFavorite = favorites.some(fav => fav.idMeal === recipe.idMeal);
    const heartClass = isFavorite ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-400';
    
    return `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700">
            <div class="relative">
                <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="w-full h-48 object-cover">
                <button onclick="toggleFavorite(${JSON.stringify(recipe).replace(/"/g, '&quot;')})" 
                        class="absolute top-3 right-3 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110">
                    <i class="${heartClass}"></i>
                </button>
            </div>
            <div class="p-5">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">${recipe.strMeal}</h3>
                <div class="flex items-center justify-between mb-4">
                    <span class="bg-gradient-to-r from-primary to-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">${recipe.strCategory}</span>
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">${recipe.strArea}</span>
                </div>
                <button onclick="openRecipeModal('${recipe.idMeal}')" 
                        class="w-full bg-gradient-to-r from-secondary to-green-500 text-white py-3 px-4 rounded-xl hover:from-green-500 hover:to-secondary transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    View Recipe
                </button>
            </div>
        </div>
    `;
}

// Modal functions
async function openRecipeModal(recipeId) {
    const recipe = await getRecipeDetails(recipeId);
    if (!recipe) return;
    
    currentRecipe = recipe;
    
    // Update modal content
    document.getElementById('modal-title').textContent = recipe.strMeal;
    document.getElementById('modal-image').src = recipe.strMealThumb;
    document.getElementById('modal-image').alt = recipe.strMeal;
    document.getElementById('modal-category').textContent = recipe.strCategory;
    document.getElementById('modal-area').textContent = recipe.strArea;
    document.getElementById('modal-instructions').textContent = recipe.strInstructions;
    
    // Update ingredients
    const ingredients = getRecipeIngredients(recipe);
    const measurements = getRecipeMeasurements(recipe);
    const ingredientsList = ingredients.map((ingredient, index) => 
        `<div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
            <span class="font-medium">${ingredient}</span>
            <span class="text-gray-500">${measurements[index] || ''}</span>
        </div>`
    ).join('');
    
    document.getElementById('modal-ingredients').innerHTML = ingredientsList;
    
    // Update favorite button
    updateModalFavoriteButton(recipe);
    
    // Update external links
    const youtubeLink = document.getElementById('modal-youtube');
    const sourceLink = document.getElementById('modal-source');
    
    if (recipe.strYoutube) {
        youtubeLink.href = recipe.strYoutube;
        youtubeLink.classList.remove('hidden');
    } else {
        youtubeLink.classList.add('hidden');
    }
    
    if (recipe.strSource) {
        sourceLink.href = recipe.strSource;
        sourceLink.classList.remove('hidden');
    } else {
        sourceLink.classList.add('hidden');
    }
    
    // Show modal
    document.getElementById('recipe-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('recipe-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentRecipe = null;
}

function getRecipeMeasurements(recipe) {
    const measurements = [];
    for (let i = 1; i <= 20; i++) {
        const measurement = recipe[`strMeasure${i}`];
        if (measurement && measurement.trim()) {
            measurements.push(measurement.trim());
        }
    }
    return measurements;
}

// Enhanced favorites functions
function toggleFavorite(recipe) {
    const existingIndex = favorites.findIndex(fav => fav.idMeal === recipe.idMeal);
    
    if (existingIndex > -1) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        showNotification('Removed from favorites', 'success');
    } else {
        // Add to favorites
        favorites.push(recipe);
        showNotification('Added to favorites', 'success');
    }
    
    // Update localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Update UI
    updateFavoriteCount();
    updateAllHeartIcons(recipe.idMeal);
    
    // Update modal if open
    if (currentRecipe && currentRecipe.idMeal === recipe.idMeal) {
        updateModalFavoriteButton(recipe);
    }
    
    // Refresh current view if needed
    const currentView = document.querySelector('.view:not(.hidden)');
    if (currentView && currentView.id === 'favorites-view') {
        loadFavorites();
    }
}

function updateModalFavoriteButton(recipe) {
    const isFavorite = favorites.some(fav => fav.idMeal === recipe.idMeal);
    const heartIcon = document.getElementById('modal-heart');
    const favoriteText = document.getElementById('modal-favorite-text');
    
    if (isFavorite) {
        heartIcon.className = 'fas fa-heart text-red-500';
        favoriteText.textContent = 'Remove from Favorites';
    } else {
        heartIcon.className = 'far fa-heart text-gray-400';
        favoriteText.textContent = 'Add to Favorites';
    }
}

function updateAllHeartIcons(recipeId) {
    // Update all heart icons for this recipe across all views
    const isFavorite = favorites.some(fav => fav.idMeal === recipeId);
    const heartClass = isFavorite ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-400';
    
    // Find all heart buttons for this recipe
    const heartButtons = document.querySelectorAll(`button[onclick*="${recipeId}"] i`);
    heartButtons.forEach(icon => {
        if (icon.classList.contains('fa-heart')) {
            icon.className = heartClass;
        }
    });
}

function loadFavorites() {
    const favoritesGrid = document.getElementById('favorites-grid');
    const noFavorites = document.getElementById('no-favorites');
    
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '';
        noFavorites.classList.remove('hidden');
    } else {
        noFavorites.classList.add('hidden');
        displayRecipes(favorites, 'favorites-grid');
    }
}

function updateFavoriteCount() {
    document.getElementById('fav-count').textContent = favorites.length;
}

// Letter navigation
function initializeLetterNav() {
    const letterNav = document.getElementById('letter-nav');
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    
    letterNav.innerHTML = alphabet.map(letter => 
        `<button onclick="loadRecipesByLetter('${letter}')" 
                class="letter-btn px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all duration-200 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 ${letter === 'a' ? 'active' : ''}">
            ${letter.toUpperCase()}
        </button>`
    ).join('');
}

// Utility functions
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 border-l-4 p-4 rounded-xl shadow-2xl transform transition-all duration-300 translate-x-full ${
        type === 'success' ? 'border-green-500' : 
        type === 'error' ? 'border-red-500' : 
        'border-blue-500'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle text-green-500' : 
                type === 'error' ? 'fa-exclamation-circle text-red-500' : 
                'fa-info-circle text-blue-500'
            } mr-3"></i>
            <span class="text-gray-900 dark:text-white font-medium">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}