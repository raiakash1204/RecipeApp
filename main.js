const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const recipeList = document.getElementById('recipeList');
const recipeModal = document.getElementById('recipeModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const modalImage = document.getElementById('modalImage');
const modalIngredients = document.getElementById('modalIngredients');
const modalInstructions = document.getElementById('modalInstructions');

// Event Listeners
searchButton.addEventListener('click', () => searchRecipes(searchInput.value.trim()));
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchRecipes(searchInput.value.trim());
});
closeModal.addEventListener('click', () => recipeModal.style.display = 'none');
window.addEventListener('click', (e) => {
  if (e.target === recipeModal) recipeModal.style.display = 'none';
});

// Search Recipes
async function searchRecipes(query) {
  if (!query) {
    recipeList.innerHTML = '<p>Please enter a search term.</p>';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.meals) {
      displayRecipes(data.meals);
    } else {
      recipeList.innerHTML = '<p>No recipes found.</p>';
    }
  } catch (error) {
    console.error('Error fetching recipes:', error);
    recipeList.innerHTML = '<p>Error fetching recipes. Please try again.</p>';
  }
}

// Display Recipes as Cards
function displayRecipes(recipes) {
  recipeList.innerHTML = '';
  recipes.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
      <h3>${recipe.strMeal}</h3>
    `;
    card.addEventListener('click', () => showRecipeDetails(recipe.idMeal));
    recipeList.appendChild(card);
  });
}

// Fetch and Show Recipe Details
async function showRecipeDetails(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/lookup.php?i=${id}`);
    const data = await response.json();
    const recipe = data.meals[0];

    modalTitle.textContent = recipe.strMeal;
    modalImage.src = recipe.strMealThumb;
    modalInstructions.textContent = recipe.strInstructions;

    // Extract Ingredients
    modalIngredients.innerHTML = '';
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        const li = document.createElement('li');
        li.textContent = `${measure} ${ingredient}`;
        modalIngredients.appendChild(li);
      }
    }

    recipeModal.style.display = 'block';
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    recipeList.innerHTML = '<p>Error fetching recipe details. Please try again.</p>';
  }
}