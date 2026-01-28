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
	// Add all created HTML Elements
	spellsHeader.appendChild(filtersDetails);
	spellsHeader.appendChild(sortersDetails);
});

class ABF_spellsManager {
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
	}
}

class Sorter {
	static createSorterSection() {
		const sorterSection = document.createElement("div");
		sorterSection.classList.add("common-titled-input", "spell-sorts-container", "justify-to-the-right");
		
		const sorterLabel = document.createElement("p");
		sorterLabel.classList.add("label");
		sorterLabel.innerHTML = ABF_spellsManager.localize(LocalizationKeys.SORTER_LABEL);
		sorterSection.appendChild(sorterLabel);
		// Create Selectors
		const sorterMainSelector = document.createElement("select");
		sorterMainSelector.classList.add("input");
		
		const optionAlphabetical = document.createElement("option");
		optionAlphabetical.value = "alphabetical";
		optionAlphabetical.innerHTML = ABF_spellsManager.localize(LocalizationKeys.SORT_ALPHABETICALLY_LABLE);
		sorterMainSelector.appendChild(optionAlphabetical);
		const optionPath = document.createElement("option");
		optionPath.value = "path";
		optionPath.innerHTML = ABF_spellsManager.localize(LocalizationKeys.SORT_PATH_LABLE);
		sorterMainSelector.appendChild(optionPath);
		const optionLevel = document.createElement("option");
		optionLevel.value = "level";
		optionLevel.innerHTML = ABF_spellsManager.localize(LocalizationKeys.SORT_BY_LEVEL_LABLE);
		sorterMainSelector.appendChild(optionLevel);
		
		sorterSection.appendChild(sorterMainSelector);
		const sorterSecondarySelector = sorterMainSelector.cloneNode(true);
		sorterSection.appendChild(sorterSecondarySelector);

		const sorterButton = document.createElement("button");
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
	 * Creates and returns a button that sorts the spells alphabetically when clicked
	 * @returns {HTMLElement}
	 */
	static createSorterAlphabeticalButton() {
		// Create the buttons
		const alphabeticalButton = document.createElement("button");
		alphabeticalButton.type = "button";
		alphabeticalButton.classList.add("input");
		alphabeticalButton.innerHTML = ABF_spellsManager.localize(LocalizationKeys.SORT_ALPHABETICALLY_LABLE);
		// Add Event Listeners
			alphabeticalButton.addEventListener("click", () => {ABF_spellsManager.applySorter(Sorter.sortAlphabetically)});
		// Return
		return alphabeticalButton;
	}

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
		const pathLabel = document.createElement("p");
		pathLabel.classList.add("label");
		pathLabel.innerHTML = ABF_spellsManager.localize(LocalizationKeys.FILTER_PATH_LABEL);
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
		pathsSelector.classList.add("input")
		// Add default "All" option and add it as default
		const defaultOption = document.createElement("option");
		defaultOption.value = "All";
		defaultOption.innerHTML = ABF_spellsManager.localize(LocalizationKeys.FILTER_PATH_OPTION_ALL);
		defaultOption.selected = true;
		pathsSelector.appendChild(defaultOption);
		// Add options for each path
		paths.forEach(path => {
			let option = document.createElement("option");
			option.value = path;
			let text = path.split(/(?=[A-Z])/).join(" ").toLowerCase();
			text = text.charAt(0).toUpperCase() + text.slice(1);
			option.innerHTML = text;
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
		if (path === "All") return true;
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
		const levelLabel = document.createElement("p");
		levelLabel.classList.add("label");
		levelLabel.innerHTML = ABF_spellsManager.localize(LocalizationKeys.FILTER_LEVEL_LABEL);
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
		minInput.classList.add("slider-min");
		minInput.value = minMaxLevels[0];
		
		// Create max input
		const maxInput = templateInput.cloneNode();
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
		const combatLabel = document.createElement("p");
		combatLabel.classList.add("label");
		combatLabel.innerHTML = ABF_spellsManager.localize(LocalizationKeys.FILTER_COMBAT_LABEL);
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
		combatSelector.classList.add("input");
		// Add options for each path
		const allOption = document.createElement("option");
		allOption.value = "any";
		allOption.innerHTML = ABF_spellsManager.localize(LocalizationKeys.FILTER_COMBAT_OPTION_ANY);
		allOption.selected = true;
		combatSelector.appendChild(allOption);
		const attackOption = document.createElement("option");
		attackOption.value = "attack";
		attackOption.innerHTML = ABF_spellsManager.localize(LocalizationKeys.FILTER_COMBAT_OPTION_ATTACK);
		combatSelector.appendChild(attackOption);
		const defenseOption = document.createElement("option");
		defenseOption.value = "defense";
		defenseOption.innerHTML = ABF_spellsManager.localize(LocalizationKeys.FILTER_COMBAT_OPTION_DEFENSE);
		combatSelector.appendChild(defenseOption);
		const noneOption = document.createElement("option");
		noneOption.value = "none";
		noneOption.innerHTML = "-";
		combatSelector.appendChild(noneOption);
		// Add Selector to Group
		filterCombatSelectorGroup.appendChild(combatSelector);
		// Add event Listener
		combatSelector.addEventListener("input", ()=>{ABF_spellsManager.applyFilter(Filters.validDivSpellCombat, FILTER_HIDE_CSS_CLASSES.COMBAT_FILTER, combatSelector)});
		// Return value
		return filterCombatSelectorGroup;
	}

	static validDivSpellCombat(spellDiv, combatUsage) {
		if (combatUsage === "any") return true;
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
		const searchLabel = document.createElement("p");
		searchLabel.classList.add("label");
		searchLabel.innerHTML = ABF_spellsManager.localize(LocalizationKeys.FILTER_SEARCH_LABEL);
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
	FILTER_COMBAT_OPTION_DEFENSE: "filter-combat-option-defense"
});