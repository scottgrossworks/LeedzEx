import { extractAndRedact, pruneShortLines } from "./parser.js";
import { processHighlight } from "./highlight.js";


const hiddenIconPath = 'icons/hidden.svg';
const visibleIconPath = 'icons/visible.svg';

// Cache DOM elements and state
// these fields should be copied into a fresh Leed object when the user
// posts this leed
const STATE = {

    lists : {
        friends: [],
        email: [],
        phone: [],
        location: []
    },

    price:0,
    activeField: null,
    lastSelection: "",
    domElements: {
        inputs: null,
        arrows: null
    }
};

// Initialize DOM cache after load
function initializeDOMCache() {
    STATE.domElements.inputs = document.querySelectorAll('.sidebar-input');
    STATE.domElements.arrows = document.querySelectorAll('.input-arrow');
}

// Unified input value updater
function updateInputWithArrayValue(inputId, array, index = 0) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (array && array.length > 0) {
        input.value = array[index % array.length];
        const arrow = input.parentElement?.querySelector('.input-arrow');
        if (arrow) {
            arrow.style.opacity = (array.length > 1) ? '0.4' : '0';
        }
    }
}

// Unified selection handler
function handleTextSelection(selection, source = 'sidebar') {
    if (!selection) return;
    
    if (STATE.activeField) {
        processHighlight(selection, STATE.activeField);
    } else {
        STATE.lastSelection = selection;
    }
    
    console.log(`[LeedzEx] Selection from ${source}:`, selection);
}

// Setup event listeners
function setupEventListeners() {
    // Input field click handler
    STATE.domElements.inputs.forEach(input => {
        input.addEventListener("click", () => {
            STATE.activeField = input.id;
            if (STATE.lastSelection && !input.value) {
                processHighlight(STATE.lastSelection, input.id);
                STATE.lastSelection = "";
            }
        });
    });

    // Arrow click handler with rotation
    STATE.domElements.arrows.forEach(arrow => {
        let currentIndex = 0;
        const input = arrow.closest('.input-wrapper')?.querySelector('input');
        if (!input) return;

        arrow.addEventListener('click', () => {

            if (arrow.style.opacity === '0') return;
            
            // FIXME FIXME FIXME
            const array = STATE.lists[input.id];
            if (array && array.length > 1) {
                currentIndex = (currentIndex + 1) % array.length;
                updateInputWithArrayValue(input.id, array, currentIndex);
                
                // rotate the arrow
                const newRotation = ((parseInt(arrow.getAttribute('data-rotation') || 0) + 90) % 360);
                arrow.setAttribute('data-rotation', newRotation);
                arrow.style.transform = `rotate(${newRotation}deg)`;
            }
        });
    });

    // Unified selection handler
    document.addEventListener("mouseup", () => {
        const selection = window.getSelection().toString().trim();
        handleTextSelection(selection);
    });
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "leedz_update_selection") {
        handleTextSelection(message.selection, 'content');
    }
});

// Initialize on DOM load
window.addEventListener("DOMContentLoaded", () => {
    initializeDOMCache();
    setupEventListeners();
    
    chrome.runtime.sendMessage({ type: "leedz_request_dom" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("[LeedzEx] Send error:", chrome.runtime.lastError.message);
            return;
        }

        if (response?.type === "leedz_dom_data") {
            const { title, bodyText } = response;
            const pruned = pruneShortLines(bodyText, 5);
            const blob = extractAndRedact(pruned, STATE.lists['email'], STATE.lists['phone']);

            updateInputWithArrayValue('email', STATE.lists['email']);
            updateInputWithArrayValue('phone', STATE.lists['phone']);
            updateInputWithArrayValue('location', STATE.lists['location']);
            
            console.log("[LeedzEx] Data processed:", {
                title,
                emailsFound: STATE.lists['email'].length,
                phonesFound: STATE.lists['phone'].length,
                locationsFound: STATE.lists['location'].length
            });
        }
    });


    // visibility icons for pay-to-view fields
    //
    const iconDivs = document.querySelectorAll(".visibility-icon");

    iconDivs.forEach(iconDiv => {
      // Load default hidden icon
      loadSVGIcon(hiddenIconPath, iconDiv);
      iconDiv.setAttribute('isHidden', 'true');
      
      iconDiv.addEventListener('click', () => {
        let isHidden = iconDiv.getAttribute('isHidden');
        setVisIcon( iconDiv, isHidden );
        // FIXME FIXME FIXME
        // additional logic here for toggling visibility
      });
    });



});



function loadSVGIcon(path, container) {
  fetch(path)
    .then(res => res.text())
    .then(svg => {
      container.innerHTML = svg;
    });
}



export function setVisIcon( iconDiv, isHidden ) {
  loadSVGIcon( isHidden ? hiddenIconPath : visibleIconPath, iconDiv);
}