console.log('Form JavaScript executed');
let contactId
async function getContactId(email) {
    if (contactId) return contactId
    const data = {
        apiName: "KEAP",
        endpoint: `v1/contacts/?email=${email}`,
        method: 'GET'
    };

    try {
        const response = await fetch('https://http-nodejs-production-5fbc.up.railway.app/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('Response:', result);

        if (!result.contacts || result.contacts.length === 0) {
            throw new Error('No contacts found');
        }

        return result.contacts[0].id;
    } catch (error) {
        console.log('Error:', error);
        return null;
    }
}
const routingLogic = {
    //"inf_field_FirstName": {
    //    "default": 1,
    //    "prefillFromUrl": true,
    //    "prefillParams": [
    //        "inf_field_FirstName"
    //    ]
    //},
    //"inf_field_LastName": {
    //    "default": 2,
    //    "prefillFromUrl": true,
    //    "prefillParams": [
    //        "inf_field_LastName"
    //    ]
    //},
    //"inf_field_Email": {
    //    "default": 3,
    //    "prefillFromUrl": true,
    //    "prefillParams": [
    //        "inf_field_Email"
    //    ]
    //},
    //"inf_field_Phone1": {
    //    "default": 4,
    //    "prefillFromUrl": true,
    //    "prefillParams": [
    //        "inf_field_Phone1"
    //    ]
    //}, 
    "contact-info": {
        "default": 1,
        "prefillFromUrl": true,
        "prefillParams": ["inf_field_FirstName", "inf_field_Email", "inf_field_Phone1"]
    },
    "entrepreneur_or_no": {
        "default": 2,
        "answers": { // Next question
            "I'm not a business owner and am not actively wanting to start one at this time.": 13,
        }
    },
    "business_type": {
        "default": 3
    },
    "how_long_in_business": {
        "default": 3,
    },
    "areas_for_support": {
        "default": 4
    },
    "biggest_challenge": {
        "default": 5
    },
    "ft_pt": {
        "default": 6
    },
    "monthly_rev": {
        "default": 7
    },
    "income_goal": {
        "default": 8
    },
    "household_income": {
        "default": 9
    },
    "resources_to_invest": {
        "default": 10
    },
    "other_programs": {
        "default": 11
    },
    "comitment_level": {
        "default": "submit"
    },
    "urgency": {
        "default": 12
    },
    "interest_topics": {
        "default": 'submit' // or the appropriate next question index after interest topics
    },
};
const formElements = Array.from(document.querySelectorAll('.infusion-field'))
let currentElementIndex = 0;
let navigationHistory = [];
formElements.forEach(el => {
    el.isActive = true
    if (el.classList?.contains('noshow')) {
        el.isActive = false
    }
});
function showQuestion(index, firstTime = false) {
    console.log(formElements, index)
    formElements.forEach((el, i) => {
        const inputEl = el.querySelector('input, select, textarea');
        console.log(`Element ${i} is active: ${el.isActive}`);
        if (i === index) {
            console.log(`Showing element ${i}`);
            el.style.display = '';
            console.log(el)
            if (inputEl) {
                inputEl.setAttribute('required', 'required');
            }
        } else {
            el.style.display = 'none';
            if (inputEl) {
                inputEl.removeAttribute('required');
            }
        }
    });
    document.getElementById('backButton').style.display = index === 0 ? 'none' : 'inline-block';
    document.getElementById('nextButton').textContent = index === formElements.length - 1 ? 'Submit' : 'Next';
    document.getElementById('nextButton').type = index === formElements.length - 1 ? 'submit' : 'button';
    updateProgressBar(firstTime);
}
function encodeCurlyApostrophe(str) {
    return str // str.replace(/'/g, '&rsquo;');
}
function getNextIndex(currentElement) {
    const inputEls = currentElement.querySelectorAll('input, select, textarea');
    let elementName = null;

    if (currentElement.id === 'contact-info') {
        elementName = 'contact-info';
    } else if (inputEls.length > 0) {
        elementName = inputEls[0].name;
    }

    let nextIndex = elementName ? routingLogic[elementName].default : 'submit';
    console.log(`Current element: ${elementName}, Next index: ${nextIndex}`);

    if (elementName && routingLogic[elementName].answers) {
        const encodedValue = encodeCurlyApostrophe(inputEls[0].value);
        if (routingLogic[elementName].answers[encodedValue]) {
            nextIndex = routingLogic[elementName].answers[encodedValue];
        }
    }

    formElements.forEach((el, index) => {
        if (!el.isActive || (index >= currentElementIndex && index < nextIndex) || el.classList?.contains('noshow')) {
            el.isActive = false;
        } else {
            el.isActive = true;
        }
    });

    while (nextIndex !== 'submit' && !formElements[nextIndex].isActive) {
        nextIndex = getNextIndex(formElements[nextIndex]);
    }

    console.log(`Next index after adjustment: ${nextIndex}`);
    return nextIndex;
}
//function getNextIndex(currentElement) {
//    const inputEl = currentElement.querySelector('input, select, textarea');
//    const elementName = inputEl ? inputEl.name : null;
//    let nextIndex = elementName ? routingLogic[elementName].default : 'submit';
//    console.log(`Current element: ${elementName}, Next index: ${nextIndex}`);

//    if (elementName && routingLogic[elementName].answers) {
//        const encodedValue = encodeCurlyApostrophe(inputEl.value);
//        if (routingLogic[elementName].answers[encodedValue]) {
//            nextIndex = routingLogic[elementName].answers[encodedValue];
//        }
//    }

//    formElements.forEach((el, index) => {
//        if (!el.isActive || (index >= currentElementIndex && index < nextIndex) || el.classList?.contains('noshow')) {
//            el.isActive = false;
//        } else {
//            el.isActive = true;
//        }
//    });

//    while (nextIndex !== 'submit' && !formElements[nextIndex].isActive) {
//        nextIndex = getNextIndex(formElements[nextIndex]);
//    }

//    console.log(`Next index after adjustment: ${nextIndex}`);
//    return nextIndex;
//}
function handleBackButton() {
    if (navigationHistory.length > 0) {
        currentElementIndex = navigationHistory.pop();
        showQuestion(currentElementIndex);
    }
}

function isValidPhoneNumber(phoneNumber) {
    return /^\d{7,15}$/.test(phoneNumber.trim());
}
async function validateCurrentElement(element) {
    const inputEls = element.querySelectorAll('input, select, textarea');
    let isValid = true;

    for (const inputEl of inputEls) {
        if (inputEl.hasAttribute('required') && !inputEl.readOnly) {
            if (inputEl.value.trim() === '') {
                isValid = false;
            }
            if (inputEl.type === 'tel' && !isValidPhoneNumber(inputEl.value.trim())) {
                alert('Please enter a valid phone number with 7 to 15 digits.');
                isValid = false;
            } else if (inputEl.type === 'email' && !contactId) {
                contactId = await getContactId(inputEl.value);
            }
        }
    }

    element.answered = isValid;
    return isValid;
}
//async function validateCurrentElement(element) {
//    const inputEl = element.querySelector('input, select, textarea');
//    if (inputEl && inputEl.hasAttribute('required')) {
//        if (inputEl.value.trim() === '') {
//            return false;
//        }
//        if (inputEl.type === 'tel' && !/^\d{7,15}$/.test(inputEl.value.trim())) {
//            alert('Please enter a valid phone number with 7 to 15 digits.');
//            return false;
//        } else if (inputEl.type === 'email' && !contactId) {
//            contactId = await getContactId(inputEl.value);
//        }
//    }
//    element.answered = true;
//    return true;
//}
function roundToZeroOrWhole(number) {
    return number <= 3 ? 0 : Math.floor(number);
}
function updateProgressBar(first = false) {
    const visibleElements = formElements.filter(el => el.isActive);
    const answeredElements = formElements.filter(el => el.answered);
    const currentIndex = visibleElements.indexOf(formElements[currentElementIndex]);
    if (currentIndex === -1) {
        return;
    }
    const totalQuestions = visibleElements.length + answeredElements.length;
    const progress = first ? 1 : ((answeredElements.length) / totalQuestions) * 100;
    console.log('Visible elements:', visibleElements, 'Current index:', currentIndex, 'Total questions:', totalQuestions, 'Progress:', progress);
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progress');
    progressBar.style.width = `${progress}%`;
    progressPercent.innerText = `${roundToZeroOrWhole(progress)}%`;
    progressBar.setAttribute('aria-valuenow', progress);
}
function applyPrefillAndSkip() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ContactId')) {
        contactId = urlParams.get('ContactId');
    }
    const skipPrequal = urlParams.get('skipPrequal') === 'true';
    let allDetailsProvided = true;

    formElements.forEach((el, index) => {
        const inputEls = el.querySelectorAll('input, select, textarea');
        const elementName = el.id === 'contact-info' ? 'contact-info' : (inputEls.length > 0 ? inputEls[0].name : null);

        if (elementName === 'contact-info') {
            inputEls.forEach(inputEl => {
                const paramName = inputEl.name;
                if (urlParams.has(paramName) && urlParams.get(paramName).trim() !== "") {
                    let value = urlParams.get(paramName);
                    if (paramName === 'inf_field_Phone1') {
                        value = value.replace(/\D/g, ''); // Strip out non-numeric characters
                    }
                    inputEl.value = value;
                    inputEl.readOnly = true;
                } else {
                    allDetailsProvided = false;
                }
            });
        }

        if (skipPrequal && elementName === 'entrepreneur_or_no') {
            el.isActive = false;
            return;
        }
    });

    if (allDetailsProvided) {
        currentElementIndex = routingLogic['contact-info'].default;
    }

    showQuestion(currentElementIndex, firstTime = true);
}

//function applyPrefillAndSkip() {
//    const urlParams = new URLSearchParams(window.location.search);
//    if (urlParams.has('ContactId')) {
//        contactId = urlParams.get('ContactId');
//    }
//    const skipPrequal = urlParams.get('skipPrequal') === 'true';
//    formElements.forEach((el, index) => {
//        const inputEl = el.querySelector('input, select, textarea');
//        const elementName = inputEl ? inputEl.name : null;
//        if (skipPrequal && elementName === 'entrepreneur_or_no') {
//            el.isActive = false;
//            return;
//        }
//        if (inputEl) {
//            if (routingLogic[elementName] && routingLogic[elementName].prefillParams) {
//                const prefillParams = routingLogic[elementName].prefillParams;
//                for (let param of prefillParams) {
//                    if (urlParams.has(param) && urlParams.get(param).trim() !== "") {
//                        let value = urlParams.get(param);
//                        if (elementName === 'inf_field_Phone1') {
//                            value = value.replace(/\D/g, ''); // Strip out non-numeric characters
//                        }
//                        inputEl.value = value;
//                        const nextIndex = getNextIndex(el);
//                        if (nextIndex !== 'submit') {
//                            el.isActive = false;
//                            el.style.display = 'none';
//                            currentElementIndex = nextIndex;
//                        }
//                        break;
//                    }
//                }
//            }
//        }
//    });
//    currentElementIndex = formElements[currentElementIndex].isActive ? currentElementIndex : currentElementIndex + 1;
//    console.log(currentElementIndex)
//    showQuestion(currentElementIndex, firstTime = true);
//}
function handleSubmit() {
    const urlParams = new URLSearchParams(window.location.search);
    let soSkip = false
    formElements.forEach(el => {
        const inputEl = el.querySelector('input, select, textarea');
        let name = inputEl.name
        if (inputEl.name === 'inf_field_FirstName') {
            name = 'Name'
        } else if (inputEl.name === 'inf_field_Email') {
            name = 'Email'
            soSkip = true
        } else if (inputEl.name === 'inf_field_Phone1') {
            name = 'Phone'
        }
        if (inputEl && inputEl.value) {
            const encodedValue = inputEl.value.replace(/\+/g, '%20');
            urlParams.append(name, encodedValue);
        }
    });
    if (soSkip) {
        urlParams.append('soSkip', 1);
    }
    if (contactId) {
        urlParams.append('ContactId', contactId);
    }
    let redirectUrl = 'https://davidbayercoaching.com/ss-survey-results'; // Default thank you page
    // Add your logic to set redirectUrl based on answers here
    console.log(`${redirectUrl}?${urlParams.toString().replace(/\+/g, '%20')}`)
    window.location.href = `${redirectUrl}?${urlParams.toString()}`;
}
async function handleNextButton() {
    const currentElement = formElements[currentElementIndex];
    const valid = await validateCurrentElement(currentElement);
    if (!validateCurrentElement(currentElement)) {
        alert('Please fill in the required fields.');
        return;
    }
    const fields = currentElement.querySelectorAll('input[name], textarea[name], select[name]');
    const emailInvalid = Array.from(fields).some(field => {
        if (field.name.toLowerCase().includes('email')) {
            const email = field.value;
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(email)) {
                alert('Please enter a valid email address.');
                return true;
            }
        }
        return false;
    });
    if (emailInvalid) {
        return;
    }
    if (formElements[currentElementIndex].id === 'entrepreneur_or_no' && formElements[currentElementIndex].querySelector('input').value === "I’m not a business owner or entrepreneur (yet) but I have an idea and want to start my own business now/soon.") {
        const toSkip = ['how_long_in_business', 'biggest_challenge', 'monthly_rev'];
        formElements.forEach(el => {
            if (toSkip.includes(el.id)) {
                el.isActive = false;
            }
        })
    }
    const nextIndex = getNextIndex(currentElement);
    if (nextIndex === 'submit') {
        handleSubmit();
    } else {
        if (navigationHistory[navigationHistory.length - 1] !== currentElementIndex) {
            navigationHistory.push(currentElementIndex);
        }
        currentElementIndex = nextIndex;
        showQuestion(currentElementIndex);
        console.log(formElements, currentElementIndex, nextIndex)
        if (window.innerWidth <= 768) {
            document.getElementById('progressBar').scrollIntoView({ behavior: 'smooth' });
        }
    }
}
document.getElementById('nextButton').addEventListener('click', handleNextButton);
document.getElementById('backButton').addEventListener('click', handleBackButton);
document.querySelectorAll('.checkbox-button').forEach(button => {
    button.addEventListener('click', function () {
        const checkbox = this.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        this.classList.toggle('checked', checkbox.checked);
    });
});
const options = [
    { display: "Creating powerful differentiated messaging.", value: "Creating powerful differentiated messaging." },
    { display: "Putting together the details of an irresistible offer(s)", value: "Putting together the details of an irresistible offer(s)" },
    { display: "Having a clear action plan that I can follow every week", value: "Having a clear action plan that I can follow every week" },
    { display: "Consistently getting in front of my ideal client/prospects", value: "Consistently getting in front of my ideal client/prospects" },
    { display: "Maintaining an unshakeable mindset so I can make consistent progress", value: "Maintaining an unshakeable mindset so I can make consistent progress" },
    { display: "Finding ways to generate more consistent 'now' revenue", value: "Finding ways to generate more consistent 'now' revenue" },
    { display: "Taking my already profitable business and scaling to the next level", value: "Taking my already profitable business and scaling to the next level" },
    { display: "Further developing my enrollment skills", value: "Further developing my enrollment skills" },
    { display: "Knowing what strategy to focus on now or next", value: "Knowing what strategy to focus on now or next" }
];
const selectedOptions = new Set();
const buttonContainer = document.getElementById('button-container');
const hiddenSelect = document.getElementById('areas_for_support');
options.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline-primary m-2';
    button.textContent = option.display;
    button.style.width = '100%';
    button.style.whiteSpace = 'normal';
    const isSelected = Array.from(hiddenSelect.options).some(opt => opt.value === option.value && opt.selected);
    if (isSelected) {
        selectedOptions.add(option.value);
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-primary');
    }
    button.addEventListener('click', function () {
        if (selectedOptions.has(option.value)) {
            selectedOptions.delete(option.value);
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline-primary');
        } else {
            selectedOptions.add(option.value);
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-primary');
        }
        updateHiddenInput();
    });
    buttonContainer.appendChild(button);
});
function updateHiddenInput() {
    const options = hiddenSelect.options;
    for (let i = 0; i < options.length; i++) {
        if (selectedOptions.has(options[i].value)) {
            options[i].selected = true;
        } else {
            options[i].selected = false;
        }
    }
}
document.querySelectorAll('#button-container-describesyou .btn').forEach(button => {
    button.addEventListener('click', function () {
        document.querySelectorAll('#button-container-describesyou .btn').forEach(btn => btn.classList.remove('btn-primary'));
        button.classList.add('btn-primary');
        document.getElementById('entrepreneur_or_no').value = button.getAttribute('data-value');
    });
});
const selects = document.querySelectorAll('select.form-control');
selects.forEach(select => {
    const parentDiv = select.parentElement;
    const options = Array.from(select.options);
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'infusion-field-input-container button-container';
    const isRange = options.every((option, index) => {
        if (index === 0) return true;
        return !isNaN(option.value) && +option.value === index;
    });
    if (isRange && options.length === 11) {
        const sliderLabel = document.createElement('label');
        sliderLabel.textContent = "Select a value:";
        sliderLabel.className = 'range-label';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 1;
        slider.max = 10;
        slider.value = 1;
        slider.className = 'form-range';
        const sliderValue = document.createElement('span');
        sliderValue.textContent = slider.value;
        sliderValue.className = 'range-value';
        slider.addEventListener('input', function () {
            sliderValue.textContent = slider.value;
            select.value = slider.value;
        });
        buttonContainer.appendChild(sliderLabel);
        buttonContainer.appendChild(slider);
        buttonContainer.appendChild(sliderValue);
    } else {
        options.forEach(option => {
            if (option.value !== '') {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-outline-primary btn-sm';
                button.textContent = option.textContent;
                button.style.whiteSpace = 'normal';
                button.setAttribute('data-value', option.value);
                button.addEventListener('click', function () {
                    buttonContainer.querySelectorAll('.btn').forEach(btn => btn.classList.remove('btn-primary'));
                    button.classList.add('btn-primary');
                    select.value = button.getAttribute('data-value');
                });
                buttonContainer.appendChild(button);
            }
        });
    }
    select.style.display = 'none';
    parentDiv.appendChild(buttonContainer);
});
applyPrefillAndSkip();

console.log('Made it to the end of the script');