document.addEventListener("DOMContentLoaded", function () {
  const inputField = document.getElementById("inputField");
  const titleField = document.getElementById("titleField");
  const saveButton = document.getElementById("saveButton");
  const stringList = document.getElementById("stringList");
  const copyAllButton = document.getElementById("copyAllButton");

  function init() {
    loadStoredStrings();
    addEventListeners();
  }

  function loadStoredStrings() {
    chrome.storage.sync.get({ strings: [] }, function (result) {
      result.strings.forEach(function (str) {
        addStringToList(str.title, str.value);
      });
      makeListItemsDraggable();
    });
  }

  function addEventListeners() {
    saveButton.addEventListener("click", saveData);
    copyAllButton.addEventListener("click", copyAllData);
    inputField.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        saveData();
      }
    });
    titleField.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        saveData();
      }
    });
  }

  function copyAllData() {
    chrome.storage.sync.get({ strings: [] }, function (result) {
      const allData = result.strings
        .map((str) => `${str.title}\n${str.value}`)
        .join("\n\n");
      copyTextFromInput(allData);
    });
  }

  function copyTextFromInput(textToCopy) {
    const tempInput = document.createElement("textarea");
    tempInput.style.position = "absolute";
    tempInput.style.left = "-9999px";
    document.body.appendChild(tempInput);
    tempInput.value = textToCopy;
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
  }

  function saveData() {
    const inputValue = inputField.value.trim();
    const titleValue = titleField.value.trim();

    if (inputValue !== "") {
      chrome.storage.sync.get({ strings: [] }, function (result) {
        const updatedStrings = result.strings.concat({
          title: titleValue,
          value: inputValue,
        });
        chrome.storage.sync.set({ strings: updatedStrings }, function () {
          addStringToList(titleValue, inputValue);
          inputField.value = "";
          titleField.value = "";
          makeListItemsDraggable();
        });
      });
    }
  }

  function addStringToList(title, value) {
    const listItem = document.createElement("li");
    listItem.className = "stringItem";
    listItem.draggable = true;

    const flexContainer = document.createElement("div");
    flexContainer.style.display = "flex";
    flexContainer.style.flexDirection = "column";
    flexContainer.style.gap = "4px";

    const truncatedTitle = truncateString(title, 35);
    const truncatedValue = truncateString(value, 35);

    const titleContainer = createSpan("titleContainer", truncatedTitle);
    const valueContainer = createSpan("valueContainer", truncatedValue);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.gap = "4px";

    const copyButton = createButton("copyButton", "Copy", function () {
      copyToClipboard(value);
    });

    const removeButton = createButton("removeButton", "Remove", function () {
      removeStringFromList(listItem);
    });

    buttonsContainer.appendChild(copyButton);
    buttonsContainer.appendChild(removeButton);

    flexContainer.appendChild(titleContainer);
    flexContainer.appendChild(valueContainer);

    listItem.appendChild(flexContainer);
    listItem.appendChild(buttonsContainer);

    stringList.appendChild(listItem);
  }

  function truncateString(str, maxLength) {
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + "...";
    } else {
      return str;
    }
  }

  function removeStringFromList(listItem) {
    const removedString = listItem.childNodes[0].childNodes[0].textContent; // Assuming title is the first child of flexContainer
    listItem.remove();

    chrome.storage.sync.get({ strings: [] }, function (result) {
      const updatedStrings = result.strings.filter(function (s) {
        return s.title !== removedString;
      });

      chrome.storage.sync.set({ strings: updatedStrings });
    });
  }

  function copyToClipboard(str) {
    const tempInput = document.createElement("input");
    document.body.appendChild(tempInput);
    tempInput.value = str;
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
  }

  function makeListItemsDraggable() {
    const listItems = document.querySelectorAll(".stringItem");
    listItems.forEach(function (item) {
      item.addEventListener("dragstart", handleDragStart);
      item.addEventListener("dragover", handleDragOver);
      item.addEventListener("drop", handleDrop);
    });
  }

  function handleDragStart(e) {
    e.target.classList.add("dragging");
    e.dataTransfer.setData("text/plain", e.target.textContent);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    const sourceItem = document.querySelector(".dragging");
    const targetItem = e.target.closest(".stringItem");

    if (sourceItem && targetItem) {
      const sourceIndex = Array.from(sourceItem.parentNode.children).indexOf(
        sourceItem
      );
      const targetIndex = Array.from(targetItem.parentNode.children).indexOf(
        targetItem
      );

      if (sourceIndex !== -1 && targetIndex !== -1) {
        chrome.storage.sync.get({ strings: [] }, function (result) {
          const updatedStrings = [...result.strings];
          const sourceString = updatedStrings.splice(sourceIndex, 1)[0];
          updatedStrings.splice(targetIndex, 0, sourceString);
          chrome.storage.sync.set({ strings: updatedStrings });

          const stringList = document.getElementById("stringList");
          const listItems = Array.from(stringList.children);
          listItems.splice(sourceIndex, 1);
          listItems.splice(targetIndex, 0, sourceItem);

          stringList.innerHTML = "";
          listItems.forEach((item) => stringList.appendChild(item));
          makeListItemsDraggable();
        });
      }

      sourceItem.classList.remove("dragging");
    }
  }

  function createSpan(className, textContent) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = textContent;
    return span;
  }

  function createButton(className, textContent, clickHandler) {
    const button = document.createElement("button");
    button.className = className;
    button.textContent = textContent;
    button.addEventListener("click", clickHandler);
    return button;
  }

  // Initialize the extension
  init();
});
