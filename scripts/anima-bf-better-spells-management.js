Hooks.once('init', () => {
  ABF_spellsManager.initialize();
});

const FILTER_HIDE_CSS_CLASSES = Object.freeze({
	PATH_FILTER: "hideDivByLevel",
	LEVEL_FILTER: "hideDivByPath",
	COMBAT_FILTER: "hideDivByCombat",
	SEARCH_FILTER: "hideDivBySearch"
});

Hooks.on('renderActorSheet', (app, html, data) => {
	// find the element containing the header of the spells
	const spellsHeader = document.getElementsByClassName("spells").item(0).children.item(0);
	// adapt it with css classes to be able to add our element without changing the overall style
	spellsHeader.classList.add("spell-header-style-adaptation");
	const headerTitle = spellsHeader.getElementsByClassName("group-header-title").item(0);
	headerTitle.classList.add("spell-header-title-style-adaptation");
	// Create a details element to contain our filters
	const filtersDetails = document.createElement("details");
	filtersDetails.open = false;
	filtersDetails.classList.add("spell-details-container");
	const filtersSummary = document.createElement("summary");
	filtersSummary.classList.add("spell-filters-summary-first");
	filtersSummary.innerHTML = ABF_spellsManager.localize(LocalizationKeys.FILTERS_SUMMARY_LABEL);
	filtersDetails.appendChild(filtersSummary);
	// Create our container for our filter HTML elements
	const filtersContainer = document.createElement("div");
	filtersContainer.classList.add("spell-header-sorts-and-filters-container");
	// Retrive spell list
	const spellList = ABF_spellsManager.getSpellsList(ABF_spellsManager.getSpellsContainer());
	// Create and Add Filter Selects
	filtersContainer.appendChild(Filters.createFilterLevelSelectors(spellList));
	filtersContainer.appendChild(Filters.createFilterCombatSelector());
	filtersContainer.appendChild(Filters.createFilterPathSelector(spellList));
	filtersContainer.appendChild(Filters.createFilterSearchInput());
	filtersDetails.appendChild(filtersContainer);
	// Create a details element to contain our sorters
	const sortersDetails = document.createElement("details");
	sortersDetails.open = false;
	sortersDetails.classList.add("spell-details-container");
	const sortersSummary = document.createElement("summary");
	sortersSummary.innerHTML = ABF_spellsManager.localize(LocalizationKeys.SORTS_SUMMARY_LABEL);
	sortersDetails.appendChild(sortersSummary);
	// Create our container for our sorter HTML elements
	const sortersContainer = document.createElement("div");
	sortersContainer.classList.add("spell-header-sorts-and-filters-container");
	// Create and Add Sorter Selects
	sortersContainer.appendChild(Sorter.createSorterSection());
	sortersDetails.appendChild(sortersContainer);
	// Create Persistency Toggle
	const persistencyToggle = PersistancyManager.createPersistancyToggle();
	// Add all created HTML Elements
	spellsHeader.appendChild(filtersDetails);
	spellsHeader.appendChild(sortersDetails);
	spellsHeader.appendChild(persistencyToggle);
	// Load saved settings
	PersistancyManager.loadSavedSettings();
});

class ABF_spellsManager {

	static MODULE_ID = "anima-bf-better-spells-management";
	static initialize() {}

	static localize(key) {
		const text = game.i18n.localize("AnimaBeyondFantasy-BetterSpellsManagement." + key);
		if (text === undefined) text = key;
		return text;
	}

	/**
	 * Gets the HTML div that contains the divs of the spells
	 * 
	 * @returns {HTMLElement | undefined}
	 */
	static getSpellsContainer() {
		return document.getElementById("spells-context-menu-container");
	}

	/**
	 * Given an HTML div containing the spell divs, returns a list of the HTML divs
	 * 
	 * @param {HTMLElement} container
	 * @returns {Array<HTMLElement>}
	 */
	static getSpellsList(container) {
		return [...container.children];
	}

	static applySorter(sortType) {
		const spellsContainer = this.getSpellsContainer();
		if (spellsContainer === null) return;

		const spellsList = [...this.getSpellsContainer().children];
		if (spellsList.length <= 1) return;

		spellsList.sort(sortType);

		// Re-append in sorted order
		spellsList.forEach(spellDiv => {
			spellsContainer.appendChild(spellDiv);
		});
		PersistancyManager.saveCurrentSettings(true);
		return spellsList;
	}

	/**
	 * 
	 * @param {Function} filter
	 * @param  {...any} args 
	 * @returns {void}
	 */
	static applyFilter(filter, hideType, ...args) {
		const spellsContainer = this.getSpellsContainer();
		if (spellsContainer === null) return;
		
		const spellsList = [...this.getSpellsContainer().children];
		if (spellsList.length <= 1) return;

		spellsList.forEach(spellDiv => {
			if (filter(spellDiv, ...args)) {
				spellDiv.classList.remove(hideType);
			} else {
				spellDiv.classList.add(hideType);
			}
		});
		PersistancyManager.saveCurrentSettings(true);
	}
}

class Sorter {

	static mainSelectorId = "spell-sorter-main-selector";
	static secondarySelectorId = "spell-sorter-secondary-selector";
	static sorterButtonId = "spell-sorter-apply-button";
	
	static createSorterSection() {
		const sorterSection = document.createElement("div");
		sorterSection.classList.add("common-titled-input", "spell-sorts-container", "justify-to-the-right");
		// Create Label for Selectors
		const sorterLabel = HTMLBuilder.createLabel(ABF_spellsManager.localize(LocalizationKeys.SORTER_LABEL));
		sorterSection.appendChild(sorterLabel);
		// Create Main Selector
		const sorterMainSelector = document.createElement("select");
		sorterMainSelector.id = this.mainSelectorId;
		sorterMainSelector.classList.add("input");
		// Create and Add options to Main Selector
		// Alphabetical
		const optionAlphabetical = HTMLBuilder.createOption(
			"alphabetical", ABF_spellsManager.localize(LocalizationKeys.SORT_ALPHABETICALLY_LABLE)
		);
		sorterMainSelector.appendChild(optionAlphabetical);
		// Path
		const optionPath = HTMLBuilder.createOption(
			"path", ABF_spellsManager.localize(LocalizationKeys.SORT_PATH_LABLE)
		);
		sorterMainSelector.appendChild(optionPath);
		// Level
		const optionLevel = HTMLBuilder.createOption(
			"level", ABF_spellsManager.localize(LocalizationKeys.SORT_BY_LEVEL_LABLE)
		);
		sorterMainSelector.appendChild(optionLevel);
		// Add Main Selector to section
		sorterSection.appendChild(sorterMainSelector);
		// Create secondary selector by cloning main selector
		const sorterSecondarySelector = sorterMainSelector.cloneNode(true);
		sorterSecondarySelector.id = this.secondarySelectorId;
		// Add Secondary Selector to section
		sorterSection.appendChild(sorterSecondarySelector);

		const sorterButton = document.createElement("button");
		sorterButton.id = this.sorterButtonId;
		sorterButton.type = "button";
		sorterButton.classList.add("input");
		sorterButton.innerHTML = ABF_spellsManager.localize(LocalizationKeys.SORTER_BUTTON_LABLE);

		// Add Event Listeners
		sorterButton.addEventListener("click", () => {
			const sortFunction = this.createSortByFunctionFromSelectors(sorterMainSelector, sorterSecondarySelector);
			ABF_spellsManager.applySorter(sortFunction);
		});

		sorterSection.appendChild(sorterButton);

		return sorterSection;
	}

	static createSortByFunctionFromSelectors(mainSelector, secondarySelector) {
		const mainSortFunction = this.getSortFunctionFromSelectorValue(mainSelector.value);
		const secondarySortFunction = this.getSortFunctionFromSelectorValue(secondarySelector.value);
		return this.fuseSortBy(mainSortFunction, secondarySortFunction);
	}


	static getSortFunctionFromSelectorValue(selectorValue) {
		switch (selectorValue) {
			case "alphabetical":
				return Sorter.sortAlphabetically;
			case "path":
				return Sorter.sortByPath;
			case "level":
				return Sorter.sortByLevel;
			default:
				return (spellA, spellB) => {0}
		}
	}

	static fuseSortBy(sortType1, sortType2) {
		return (spellA, spellB) => {
			const result = sortType1(spellA, spellB);
			if (result !== 0) return result;
			return sortType2(spellA, spellB);
		}
	}

	/**																										**
	 * ------------------------------------------------------------------------------------------------------ *
	 * ---------------------------------------------ALPHA SORTER--------------------------------------------- *
	 * ------------------------------------------------------------------------------------------------------ *
	 *																										*/

	/**
	 * By comparing its names alphabetically, returns -1 if spellA goes before spellB, 1 if spellB goes before spellA, 0 if they are equal
	 * @param {HTMLElement} spellA
	 * @param {HTMLElement} spellB
	 * @returns {number}
	 */
	static sortAlphabetically(spellA, spellB) {
		const nameA = spellA.getElementsByClassName("name").item(0).getElementsByTagName("input").item(0).value.toUpperCase();
		const nameB = spellB.getElementsByClassName("name").item(0).getElementsByTagName("input").item(0).value.toUpperCase();
		if (nameA < nameB) {
			return -1;
		}
		if (nameA > nameB) {
			return 1;
		}
		return 0;
	}

	/**																										**
	 * ------------------------------------------------------------------------------------------------------ *
	 * ---------------------------------------------PATH  SORTER--------------------------------------------- *
	 * ------------------------------------------------------------------------------------------------------ *
	 *																										*/

	static sortByPath(spellA, spellB) {
		// Get paths
		const pathA = spellA.getElementsByClassName("via").item(0).getElementsByTagName("select").item(0).value;
		const pathB = spellB.getElementsByClassName("via").item(0).getElementsByTagName("select").item(0).value;
		// Compare paths
		if (pathA < pathB) {
			return -1;
		}
		if (pathA > pathB) {
			return 1;
		}
		return 0;
	}

	/**																										**
	 * ------------------------------------------------------------------------------------------------------ *
	 * ---------------------------------------------LEVEL SORTER--------------------------------------------- *
	 * ------------------------------------------------------------------------------------------------------ *
	 *																										*/
	
	static sortByLevel(spellA, spellB) {
		// Get levels
		const levelA = Number(spellA.getElementsByClassName("level").item(0).getElementsByTagName("input").item(0).value);
		const levelB = Number(spellB.getElementsByClassName("level").item(0).getElementsByTagName("input").item(0).value);
		// Compare levels
		if (levelA < levelB) {
			return -1;
		}
		if (levelA > levelB) {
			return 1;
		}
		return 0;
	}

	/**																										**
	 * ------------------------------------------------------------------------------------------------------ *
	 * ------------------------------------------PATH-LEVEL  SORTER------------------------------------------ *
	 * ------------------------------------------------------------------------------------------------------ *
	 *																										*/

	static sortByPathThenLevelButton() {
		// Create the buttons
		const pathLevelButton = document.createElement("button");
		pathLevelButton.type = "button";
		pathLevelButton.classList.add("input");
		pathLevelButton.innerHTML = ABF_spellsManager.localize(LocalizationKeys.SORT_PATH_LEVEL_LABLE);
		// Add Event Listeners
		pathLevelButton.addEventListener("click", () => {ABF_spellsManager.applySorter(Sorter.sortByPathThenLevel)});
		// Return
		return pathLevelButton;
	}

	static sortByPathThenLevel(spellA, spellB) {
		// Get paths
		const pathA = spellA.getElementsByClassName("via").item(0).getElementsByTagName("select").item(0).value;
		const pathB = spellB.getElementsByClassName("via").item(0).getElementsByTagName("select").item(0).value;
		// Compare paths
		if (pathA < pathB) {
			return -1;
		}
		if (pathA > pathB) {
			return 1;
		}
		// If paths are equal, compare levels
		const levelA = Number(spellA.getElementsByClassName("level").item(0).getElementsByTagName("input").item(0).value);
		const levelB = Number(spellB.getElementsByClassName("level").item(0).getElementsByTagName("input").item(0).value);
		if (levelA < levelB) {
			return -1;
		}
		if (levelA > levelB) {
			return 1;
		}
		return 0;
	}
}

class Filters {

	static pathsSelectorId = "spell-paths-selector";
	static levelMinInputId = "spell-level-min-input";
	static levelMaxInputId = "spell-level-max-input";
	static combatSelectorId = "spell-combat-selector";
	static searchInputId = "spell-search-input";

	/**																										**
	 * ------------------------------------------------------------------------------------------------------ *
	 * ---------------------------------------------PATHS FILTER--------------------------------------------- *
	 * ------------------------------------------------------------------------------------------------------ *
	 *																										*/

	/**
	 * Given a list of HTML divs containing spells, returns a list of the spells paths as strings
	 * 
	 * @param {Array<HTMLElement>} spellsList
	 * @returns {Array<string>}
	 */
	static getPaths(spellsList) {
		return spellsList.reduce(
			(accumulator, currentValue) => 
				accumulator.add(currentValue.getElementsByClassName("via").item(0).getElementsByTagName("select").item(0).value), 
			new Set([])
		);
	}

	/**
	 * Creates and returns a label for the path filter selector
	 * @returns {HTMLElement}
	 */
	static createFilterPathLabel() {
		const pathLabel = HTMLBuilder.createLabel(ABF_spellsManager.localize(LocalizationKeys.FILTER_PATH_LABEL));
		return pathLabel;
	}

	/**
	 * Given a list of HTML divs containing spells, creates and returns an HTML div containing a selector to filter by path
	 * @param {Array<HTMLElement>} spellsList
	 * @returns {HTMLElement}
	 */
	static createFilterPathSelector(spellsList) {
		const filterPathSelectorGroup = document.createElement("div");
		filterPathSelectorGroup.classList.add("common-titled-input");
		// Create Label for Selector
		const pathsSelectorLabel = this.createFilterPathLabel();
		// Add Label to Group
		filterPathSelectorGroup.appendChild(pathsSelectorLabel);
		// Get the paths
		const paths = this.getPaths(spellsList);
		// Create Selector
		const pathsSelector = document.createElement("select");
		pathsSelector.id = this.pathsSelectorId;
		pathsSelector.classList.add("input")
		// Add default "All" option and add it as default
		const defaultOption = HTMLBuilder.createOption(
			"All", ABF_spellsManager.localize(LocalizationKeys.FILTER_PATH_OPTION_ALL), true
		);
		pathsSelector.appendChild(defaultOption);
		// Add options for each path
		paths.forEach(path => {
			let text = path.split(/(?=[A-Z])/).join(" ").toLowerCase();
			text = text.charAt(0).toUpperCase() + text.slice(1);
			let option = HTMLBuilder.createOption(path, text);
			pathsSelector.appendChild(option);
		});
		// Add Selector to Group
		filterPathSelectorGroup.appendChild(pathsSelector);
		// Add event Listener
		pathsSelector.addEventListener("input", ()=>{ABF_spellsManager.applyFilter(Filters.validDivSpellPath, FILTER_HIDE_CSS_CLASSES.PATH_FILTER, pathsSelector)});
		// Return value
		return filterPathSelectorGroup;
	}

	static validDivSpellPath(spellDiv, path) {
		if (path.value === "All") return true;
		const spellPath = spellDiv
								.getElementsByClassName("via").item(0)
								.getElementsByTagName("select").item(0)
								.value;
		return spellPath === path.value;
	}

	/**																										**
	 * ------------------------------------------------------------------------------------------------------ *
	 * --------------------------------------------LEVELS  FILTER-------------------------------------------- *
	 * ------------------------------------------------------------------------------------------------------ *
	 *																										*/

	/**
	 * Given a list of HTML divs containing spells, returns a 2 element list of min and max levels found
	 * 
	 * @param {Array<HTMLElement>} spellsList
	 * @returns {Array<Number>}
	 */
	static getMinAndMaxLevels(spellsList) {
		return [...spellsList.reduce(
			(accumulator, currentValue) => {
				const level = Number(currentValue
										.getElementsByClassName("level").item(0)
										.getElementsByTagName("input").item(0)
										.value
				);
				let min = accumulator[0];
				let max = accumulator[1];
				if (min>level) min = level;
				if (max<level) max = level;
				return [min,max];
			}, [100,2]
		)];
	}

	/**
	 * Creates and returns a label for the level filter selectors
	 * @returns {HTMLElement}
	 */
	static createFilterLevelLabel() {
		const levelLabel = HTMLBuilder.createLabel(ABF_spellsManager.localize(LocalizationKeys.FILTER_LEVEL_LABEL));
		return levelLabel;
	}

	/**
	 * Given a list of HTML divs containing spells, creates and returns an HTML div containing a dual range slider to filter by level
	 * @param {Array<HTMLElement>} spellsList
	 * @returns {HTMLElement}
	 */
	static createFilterLevelSelectors(spellsList) {		
		const filterLevelsSelectorGroup = document.createElement("div");
		filterLevelsSelectorGroup.classList.add("common-titled-input");

		// Create Label
		const levelLabel = this.createFilterLevelLabel();
		filterLevelsSelectorGroup.appendChild(levelLabel);
		
		// Get min and max levels
		const minMaxLevels = this.getMinAndMaxLevels(spellsList);
		
		// Create slider container
		const sliderContainer = document.createElement("div");
		sliderContainer.classList.add("dual-range-slider");
		
		// Create track background
		const track = document.createElement("div");
		track.classList.add("slider-track");
		
		// Create template for inputs
		const templateInput = document.createElement("input");
		templateInput.type = "range";
		templateInput.classList.add("slider-input");
		templateInput.min = "2";
		templateInput.max = "100";
		templateInput.step = "2";

		// Create min input
		const minInput = templateInput.cloneNode();
		minInput.id = this.levelMinInputId;
		minInput.classList.add("slider-min");
		minInput.value = minMaxLevels[0];
		
		// Create max input
		const maxInput = templateInput.cloneNode();
		maxInput.id = this.levelMaxInputId;
		maxInput.classList.add("slider-max");
		maxInput.value = minMaxLevels[1];
		
		// Create labels display
		const labelsContainer = document.createElement("div");
		labelsContainer.classList.add("slider-labels");
		const minLabel = document.createElement("span");
		minLabel.classList.add("slider-label-value");
		minLabel.innerHTML = minMaxLevels[0];
		const separator = document.createElement("span");
		separator.classList.add("slider-label-separator");
		separator.innerHTML = " - ";
		const maxLabel = document.createElement("span");
		maxLabel.classList.add("slider-label-value");
		maxLabel.innerHTML = minMaxLevels[1];
		
		labelsContainer.appendChild(minLabel);
		labelsContainer.appendChild(separator);
		labelsContainer.appendChild(maxLabel);
		
		// Update function
		const updateSlider = () => {
			let min = parseInt(minInput.value);
			let max = parseInt(maxInput.value);
			
			if (min > max) {
				minInput.value = max;
				min = max;
			}
			if (max < min) {
				maxInput.value = min;
				max = min;
			}
			
			minLabel.innerHTML = min;
			maxLabel.innerHTML = max;
			
			// Update track fill
			const minPercent = ((min - 2) / 98) * 100;
			const maxPercent = ((max - 2) / 98) * 100;
			track.style.left = minPercent + "%";
			track.style.right = (100 - maxPercent) + "%";
		};
		minInput.addEventListener("input", updateSlider);
		minInput.addEventListener("input", ()=>{ABF_spellsManager.applyFilter(Filters.validDivSpellLevel, FILTER_HIDE_CSS_CLASSES.LEVEL_FILTER, minInput, maxInput)});
		maxInput.addEventListener("input", updateSlider);
		maxInput.addEventListener("input", ()=>{ABF_spellsManager.applyFilter(Filters.validDivSpellLevel, FILTER_HIDE_CSS_CLASSES.LEVEL_FILTER, minInput, maxInput)});
		
		// Initial update
		updateSlider();
		
		// Assemble slider
		sliderContainer.appendChild(track);
		sliderContainer.appendChild(minInput);
		sliderContainer.appendChild(maxInput);
		
		filterLevelsSelectorGroup.appendChild(sliderContainer);
		filterLevelsSelectorGroup.appendChild(labelsContainer);
		
		// Store references
		filterLevelsSelectorGroup.minInput = minInput;
		filterLevelsSelectorGroup.maxInput = maxInput;
		
		return filterLevelsSelectorGroup;
	}

	/**
	 * 
	 * @param {HTMLElement} spellDiv
	 * @param {HTMLElement} minLevel
	 * @param {HTMLElement} maxLevel
	 * @returns {boolean}
	 */
	static validDivSpellLevel(spellDiv, minLevel, maxLevel) {
		const spellLevel = Number(spellDiv
									.getElementsByClassName("level").item(0)
									.getElementsByTagName("input").item(0)
									.value
		);
		return spellLevel >= Number(minLevel.value) && spellLevel <= Number(maxLevel.value);
	}

	/**																										**
	 * ------------------------------------------------------------------------------------------------------ *
	 * --------------------------------------------COMBAT FILTER--------------------------------------------- *
	 * ------------------------------------------------------------------------------------------------------ *
	 *																										*/

	/**
	 * Creates and returns a label for the combat filter selector
	 * @returns {HTMLElement}
	 */
	static createFilterCombatLabel() {
		const combatLabel = HTMLBuilder.createLabel(ABF_spellsManager.localize(LocalizationKeys.FILTER_COMBAT_LABEL));
		return combatLabel;
	}

	static createFilterCombatSelector() {
		const filterCombatSelectorGroup = document.createElement("div");
		filterCombatSelectorGroup.classList.add("common-titled-input");
		// Create Label for Selector
		const combatSelectorLabel = this.createFilterCombatLabel();
		// Add Label to Group
		filterCombatSelectorGroup.appendChild(combatSelectorLabel);
		// Create Selector
		const combatSelector = document.createElement("select");
		combatSelector.id = this.combatSelectorId;
		combatSelector.classList.add("input");
		// Add options for each path
		const allOption = HTMLBuilder.createOption(
			"any", ABF_spellsManager.localize(LocalizationKeys.FILTER_COMBAT_OPTION_ANY), true
		);
		combatSelector.appendChild(allOption);
		const attackOption = HTMLBuilder.createOption(
			"attack", ABF_spellsManager.localize(LocalizationKeys.FILTER_COMBAT_OPTION_ATTACK)
		);
		combatSelector.appendChild(attackOption);
		const defenseOption = HTMLBuilder.createOption(
			"defense", ABF_spellsManager.localize(LocalizationKeys.FILTER_COMBAT_OPTION_DEFENSE)
		);
		combatSelector.appendChild(defenseOption);
		const noneOption = HTMLBuilder.createOption(
			"none", "-"
		);
		combatSelector.appendChild(noneOption);
		// Add Selector to Group
		filterCombatSelectorGroup.appendChild(combatSelector);
		// Add event Listener
		combatSelector.addEventListener("input", ()=>{ABF_spellsManager.applyFilter(Filters.validDivSpellCombat, FILTER_HIDE_CSS_CLASSES.COMBAT_FILTER, combatSelector)});
		// Return value
		return filterCombatSelectorGroup;
	}

	static validDivSpellCombat(spellDiv, combatUsage) {
		if (combatUsage.value === "any") return true;
		const spellCombatUsage = spellDiv
								.getElementsByClassName("combat-type").item(0)
								.getElementsByTagName("select").item(0)
								.value;
		return spellCombatUsage === combatUsage.value;
	}

	/**																										**
	 * ------------------------------------------------------------------------------------------------------ *
	 * --------------------------------------------SEARCH FILTER--------------------------------------------- *
	 * ------------------------------------------------------------------------------------------------------ *
	 *																										*/

	static createFilterSearchLabel() {
		const searchLabel = HTMLBuilder.createLabel(ABF_spellsManager.localize(LocalizationKeys.FILTER_SEARCH_LABEL));
		return searchLabel;
	}

	static createFilterSearchInput() {
		const filterSearchGroup = document.createElement("div");
		filterSearchGroup.classList.add("common-titled-input");
		// Create Label for Selector
		const searchLabel = this.createFilterSearchLabel();
		// Add Label to Group
		filterSearchGroup.appendChild(searchLabel);
		// Create Input
		const searchInput = document.createElement("input");
		searchInput.id = this.searchInputId;
		searchInput.type = "text";
		searchInput.classList.add("input");
		// Add Input to Group
		filterSearchGroup.appendChild(searchInput);
		// Add event Listener
		searchInput.addEventListener("input", ()=>{ABF_spellsManager.applyFilter(Filters.validDivSpellSearch, FILTER_HIDE_CSS_CLASSES.SEARCH_FILTER, searchInput)});
		// Return value
		return filterSearchGroup;
	}

	static validDivSpellSearch(spellDiv, searchTerm) {
		const name = spellDiv.getElementsByClassName("name").item(0).getElementsByTagName("input").item(0).value.toUpperCase();
		if (searchTerm.value === "") return true;
		if (name.length < searchTerm.value.length) return false;
		return name.includes(searchTerm.value.toUpperCase());
	}
}

class PersistancyManager {
	
	static flagId = "spell-filters-sorters-settings";
	static toggleId = "spell-filters-sorters-persistency-toggle";

	static saveCurrentSettings(checkToggleState) {
		if (checkToggleState) {
			if (!document.getElementById(this.toggleId)) return;
			if (!document.getElementById(this.toggleId).checked) return;
		}
		const mainSelectorValue = document.getElementById(Sorter.mainSelectorId).value;
		const secondarySelectorValue = document.getElementById(Sorter.secondarySelectorId).value;
		const pathsSelectorValue = document.getElementById(Filters.pathsSelectorId).value;
		const levelMinValue = document.getElementById(Filters.levelMinInputId).value;
		const levelMaxValue = document.getElementById(Filters.levelMaxInputId).value;
		const combatSelectorValue = document.getElementById(Filters.combatSelectorId).value;
		const searchInputValue = document.getElementById(Filters.searchInputId).value;
		game.users.get(game.userId).setFlag(ABF_spellsManager.MODULE_ID, this.flagId, {
			mainSelectorValue: mainSelectorValue,
			secondarySelectorValue: secondarySelectorValue,
			pathsSelectorValue: pathsSelectorValue,
			levelMinValue: levelMinValue,
			levelMaxValue: levelMaxValue,
			combatSelectorValue: combatSelectorValue,
			searchInputValue: searchInputValue
		});
	}

	static loadSavedSettings() {
		if (!game.users.get(game.userId).getFlag(ABF_spellsManager.MODULE_ID, this.toggleId)) return;
		const savedSettings = game.users.get(game.userId).getFlag(ABF_spellsManager.MODULE_ID, this.flagId);
		if (savedSettings === undefined) return;
		document.getElementById(Sorter.mainSelectorId).value = savedSettings.mainSelectorValue;
		document.getElementById(Sorter.secondarySelectorId).value = savedSettings.secondarySelectorValue;
		document.getElementById(Sorter.sorterButtonId).click();
		const pathsSelector = document.getElementById(Filters.pathsSelectorId)
		pathsSelector.value = savedSettings.pathsSelectorValue;
		pathsSelector.dispatchEvent(new Event('input'));
		document.getElementById(Filters.levelMinInputId).value = savedSettings.levelMinValue;
		const levelMaxInput = document.getElementById(Filters.levelMaxInputId);
		levelMaxInput.value = savedSettings.levelMaxValue;
		levelMaxInput.dispatchEvent(new Event('input'));
		const combatSelector = document.getElementById(Filters.combatSelectorId);
		combatSelector.value = savedSettings.combatSelectorValue;
		combatSelector.dispatchEvent(new Event('input'));
		const searchInput = document.getElementById(Filters.searchInputId);
		searchInput.value = savedSettings.searchInputValue;
		searchInput.dispatchEvent(new Event('input'));
		// Enable persistency toggle since settings would only ahve loaded if it was active
		document.getElementById(this.toggleId).checked = true;
	}

	static createPersistancyToggleLabel() {
		const label = HTMLBuilder.createLabel(ABF_spellsManager.localize(LocalizationKeys.PERSISTANCY_TOGGLE_LABEL));
		return label;
	}

	static createPersistancyToggle() {
		const toggleContainer = document.createElement("div");
		toggleContainer.classList.add("common-titled-input", "spell-persistency-toggle-container");
		// Create Toggle
		const toggle = document.createElement("input");
		toggle.id = this.toggleId;
		toggle.type = "checkbox";
		toggle.classList.add("input");
		// Add Label
		const label = this.createPersistancyToggleLabel();
		toggleContainer.appendChild(label);
		// Add Toggle to Container
		toggleContainer.appendChild(toggle);
		// Add Event Listener
		toggle.addEventListener("change", () => {
			game.users.get(game.userId).setFlag(ABF_spellsManager.MODULE_ID, this.toggleId, toggle.checked);
		});

		// Return
		return toggleContainer;
	}
}

class HTMLBuilder {
	static createLabel(text) {
		const label = document.createElement("p");
		label.classList.add("label");
		label.innerHTML = text;
		return label;
	}

	static createOption(value, text, isSelected=false) {
		const option = document.createElement("option");
		option.value = value;
		option.innerHTML = text;
		if (isSelected) option.selected = true;
		return option;
	}
}

const LocalizationKeys = Object.freeze({
	FILTERS_SUMMARY_LABEL: "filters-summary-label",
	SORTS_SUMMARY_LABEL: "sorts-summary-label",
	SORT_METHOD_NOT_EXIST: "sort-method-not-exist",
	SORT_ALPHABETICALLY_LABLE: "sort-alphabetically-lable",
	SORT_PATH_LEVEL_LABLE: "sort-path-level-lable",
	SORT_PATH_LABLE: "sort-path-lable",
	SORT_BY_LEVEL_LABLE: "sort-by-level-lable",
	SORTER_LABEL: "sorter-label",
	SORTER_BUTTON_LABLE: "sorter-button-lable",
	FILTER_PATH_LABEL: "filter-path-label",
	FILTER_LEVEL_LABEL: "filter-level-label",
	FILTER_COMBAT_LABEL: "filter-combat-label",
	FILTER_SEARCH_LABEL: "filter-search-label",
	FILTER_PATH_OPTION_ALL: "filter-path-option-all",
	FILTER_COMBAT_OPTION_ANY: "filter-combat-option-any",
	FILTER_COMBAT_OPTION_ATTACK: "filter-combat-option-attack",
	FILTER_COMBAT_OPTION_DEFENSE: "filter-combat-option-defense",
	PERSISTANCY_TOGGLE_LABEL: "persistancy-toggle-label"
});