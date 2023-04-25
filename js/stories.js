'use strict';

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
	storyList = await StoryList.getStories();
	$storiesLoadingMsg.remove();

	putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = true) {
	// console.debug("generateStoryMarkup", story);

	const hostName = story.getHostName();
	const showStar = Boolean(currentUser);

	return $(`
      <li id="${story.storyId}">
			${showStar ? getStarHTML(story, currentUser) : ''}
			${showDeleteBtn ? getDeleteBtnHTML() : ''}

        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function getDeleteBtnHTML() {
	return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

async function deleteStory(evt) {
	console.debug('deleteStory');

	const $closestLi = $(evt.target).closest('li');
	const storyId = $closestLi.attr('id');

	await storyList.removeStory(currentUser, storyId);

	// re-generate story list
	await putStoriesOnPage();
}

$storiesLists.on('click', '.trash-can', deleteStory);
/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
	console.debug('putStoriesOnPage');

	$allStoriesList.empty();

	// loop through all of our stories and generate HTML for them
	for (let story of storyList.stories) {
		const $story = generateStoryMarkup(story);
		$allStoriesList.append($story);
	}

	$allStoriesList.show();
}

/** createNewStory handles the click and creates story */

async function createNewStory(evt) {
	evt.preventDefault();

	const author = $('#create-author-form').val();
	const title = $('#create-title-form').val();
	const url = $('#create-url-form').val();
	const username = currentUser.username;

	const story = await storyList.addStory(currentUser, {
		title,
		url,
		author,
		username,
	});

	const $story = generateStoryMarkup(story);
	$allStoriesList.prepend($story);

	$submitStoryForm.hide();
	$submitStoryForm.trigger('reset');
}

$submitStoryForm.on('submit', createNewStory);

function getStarHTML(story, user) {
	const isFavorite = user.isFavorite(story);
	const starType = isFavorite ? 'fas' : 'far';
	return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}

function putFavoritesListOnPage() {
	console.debug('putFavoritesListOnPage');

	$favoritedStories.empty();

	if (currentUser.favorites.length === 0) {
		$favoritedStories.append('<h5>No favorites added!</h5>');
	} else {
		for (let story of currentUser.favorites) {
			const $story = generateStoryMarkup(story);
			$favoritedStories.append($story);
		}
	}

	$favoritedStories.show();
}

async function toggleStoryFavorite(evt) {
	console.debug('toggleStoryFavorite');

	const $tgt = $(evt.target);
	const $closestLi = $tgt.closest('li');
	const storyId = $closestLi.attr('id');
	const story = storyList.stories.find((s) => s.storyId === storyId);

	if ($tgt.hasClass('fas')) {
		await currentUser.removeFavorite(story);
		$tgt.closest('i').toggleClass('fas far');
	} else {
		await currentUser.addFavorite(story);
		$tgt.closest('i').toggleClass('fas far');
	}
}

$storiesLists.on('click', '.star', toggleStoryFavorite);
