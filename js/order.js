(() => {
	const DROPDOWN_CLASS = 'dropdown-input';
	const OPEN_CLASS = '--open';
	const ACTIVE_CLASS = '--active';

	const closeDropdown = (dropdown) => {
		dropdown?.classList.remove(OPEN_CLASS);
	};

	const closeAllDropdowns = () => {
		document.querySelectorAll(`.${DROPDOWN_CLASS}.${OPEN_CLASS}`).forEach(closeDropdown);
	};

	const selectOption = (dropdown, option, input) => {
		// Убираем активный класс со всех опций
		dropdown.querySelectorAll(`.dropdown-input__option`).forEach(opt => opt.classList.remove(ACTIVE_CLASS));
		
		if (!option) {
			input.value = '';
			return;
		}

		// Устанавливаем выбранную опцию
		option.classList.add(ACTIVE_CLASS);
		input.value = option.textContent.trim();
		
		// События
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
	};

	const initDropdown = (dropdown) => {
		if (dropdown.dataset.init) return;
		dropdown.dataset.init = 'true';

		const input = dropdown.querySelector('.dropdown-input__value');
		const optionsWrapper = dropdown.querySelector('.dropdown-input__option-wrapper');
		if (!input || !optionsWrapper) return;

		// Инициализация: если есть активная опция, синхронизируем значение
		const activeOption = dropdown.querySelector(`.dropdown-input__option.${ACTIVE_CLASS}`);
		if (activeOption && !input.value) {
			input.value = activeOption.textContent.trim();
		}

		// Клик по dropdown - открыть/закрыть
		dropdown.addEventListener('click', (e) => {
			if (e.target.closest('.dropdown-input__option')) return;
			const isOpen = dropdown.classList.contains(OPEN_CLASS);
			if (isOpen) {
				closeDropdown(dropdown);
			} else {
				closeAllDropdowns();
				dropdown.classList.add(OPEN_CLASS);
			}
		});

		// Клик по опции
		optionsWrapper.addEventListener('click', (e) => {
			const option = e.target.closest('.dropdown-input__option');
			if (!option) return;
			selectOption(dropdown, option, input);
			closeDropdown(dropdown);
		});

		// Клавиатура
		dropdown.addEventListener('keydown', (e) => {
			const isOpen = dropdown.classList.contains(OPEN_CLASS);
			const options = Array.from(dropdown.querySelectorAll('.dropdown-input__option'));

			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (isOpen) {
					const active = dropdown.querySelector(`.dropdown-input__option.${ACTIVE_CLASS}`);
					if (active) {
						selectOption(dropdown, active, input);
						closeDropdown(dropdown);
					}
				} else {
					closeAllDropdowns();
					dropdown.classList.add(OPEN_CLASS);
				}
			} else if (e.key === 'Escape') {
				closeDropdown(dropdown);
			} else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault();
				if (!isOpen) {
					closeAllDropdowns();
					dropdown.classList.add(OPEN_CLASS);
				}
				const current = options.findIndex(opt => opt.classList.contains(ACTIVE_CLASS));
				const next = e.key === 'ArrowDown' 
					? (current + 1) % options.length 
					: (current - 1 + options.length) % options.length;
				selectOption(dropdown, options[next], input);
				options[next].scrollIntoView({ block: 'nearest' });
			}
		});
	};

	const initAll = () => {
		document.querySelectorAll(`.${DROPDOWN_CLASS}`).forEach(initDropdown);
	};

	// Закрытие при клике вне
	document.addEventListener('click', (e) => {
		if (!e.target.closest(`.${DROPDOWN_CLASS}`)) {
			closeAllDropdowns();
		}
	});

	// Закрытие по Escape
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeAllDropdowns();
	});

	// Инициализация
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initAll);
	} else {
		initAll();
	}

	window.initDropdownInputs = initAll;

	// Проверка заполненности формы
	const checkForm = (form) => {
		if (!form) return false;

		// Проверяем все обязательные поля
		const requiredInputs = form.querySelectorAll('input[required]');
		const requiredDropdowns = form.querySelectorAll('.dropdown-input input[required]');
		const requiredRadios = form.querySelectorAll('input[type="radio"][required]');
		const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');

		// Проверка обычных input
		for (const input of requiredInputs) {
			if (input.type === 'radio') continue; // radio проверяем отдельно
			if (input.type === 'file') continue; // file проверяем отдельно
			if (input.type === 'checkbox') continue; // checkbox проверяем отдельно
			
			// Специальная проверка для полей телефона
			if (input.name === 'tel' || (input.placeholder && input.placeholder.includes('+7'))) {
				const phoneValue = input.value.replace(/\D/g, ''); // Убираем все нецифровые символы
				// Проверяем, что номер содержит 11 цифр (7 + 10)
				if (phoneValue.length !== 11 || !phoneValue.startsWith('7')) {
					return false;
				}
				continue;
			}
			
			if (!input.value.trim()) return false;
		}

		// Проверка dropdown-input
		for (const input of requiredDropdowns) {
			if (!input.value.trim()) return false;
		}

		// Проверка radio
		if (requiredRadios.length > 0) {
			const radioName = requiredRadios[0].name;
			const radioChecked = form.querySelector(`input[type="radio"][name="${radioName}"]:checked`);
			if (!radioChecked) return false;
		}

		// Проверка checkbox
		for (const checkbox of requiredCheckboxes) {
			if (!checkbox.checked) return false;
		}

		// Проверка загрузки фотографий
		const photoContainer = form.querySelector('.upload_photos-container');
		if (photoContainer) {
			const photoInput = photoContainer.querySelector('input[type="file"][required]');
			if (photoInput) {
				// Проверяем, есть ли загруженные файлы (проверяем и DOM, и хранилище)
				const photoItems = photoContainer.querySelectorAll('.upload_photos-item');
				if (photoItems.length === 0 || uploadedFiles.size === 0) {
					return false;
				}
			}
		}

		// Проверка загрузки фото паспорта
		// Проверяем, есть ли чекбокс "Нет возможности сделать фото"
		const notPhotoCheckbox = form.querySelector('input[name="agreement-not-photo"]');
		const isNotPhotoChecked = notPhotoCheckbox && notPhotoCheckbox.checked;
		
		// Если чекбокс не отмечен, проверяем загрузку фото
		if (!isNotPhotoChecked) {
			const pasportPhotoInputs = form.querySelectorAll('input[type="file"][name="pasport-photo"][required], input[type="file"].photo-upload-input[required]');
			if (pasportPhotoInputs.length > 0) {
				for (const input of pasportPhotoInputs) {
					if (!input.files || input.files.length === 0) {
						return false;
					}
				}
			}
		}

		return true;
	};

	// Проверка валидности телефона
	const validatePhoneField = (input, showError = true) => {
		if (!input) return true;
		
		// Проверяем только поля телефона
		if (input.name !== 'tel' && (!input.placeholder || !input.placeholder.includes('+7'))) {
			return true;
		}
		
		const phoneValue = input.value.replace(/\D/g, ''); // Убираем все нецифровые символы
		const isValid = phoneValue.length === 11 && phoneValue.startsWith('7');
		
		// Показываем ошибку только если поле было в фокусе или содержит больше чем "+7"
		// или если явно указано showError = true
		const shouldShowError = showError && (input.dataset.wasFocused === 'true' || phoneValue.length > 1);
		
		// Добавляем/убираем класс ошибки
		if (isValid || !shouldShowError) {
			input.classList.remove('order-input_error');
		} else {
			input.classList.add('order-input_error');
		}
		
		return isValid;
	};

	const updateFormButton = (form) => {
		const button = form?.querySelector('.order__btn-next');
		if (!button) return;

		// Проверяем все поля телефона и обновляем их визуальное состояние
		const phoneInputs = form.querySelectorAll('input[name="tel"], input[placeholder*="+7"]');
		phoneInputs.forEach(input => {
			if (input.placeholder && input.placeholder.includes('+7')) {
				// Показываем ошибку только если поле было в фокусе
				const showError = input.dataset.wasFocused === 'true';
				validatePhoneField(input, showError);
			}
		});

		const isValid = checkForm(form);
		button.disabled = !isValid;
	};

	const initFormValidation = () => {
		const forms = document.querySelectorAll('.order-form-wrapper');
		
		forms.forEach(form => {
			// Проверка при изменении любого поля
			form.addEventListener('input', () => updateFormButton(form));
			form.addEventListener('change', () => updateFormButton(form));
			
			// Начальная проверка
			updateFormButton(form);
		});
	};

	// Инициализация проверки формы
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initFormValidation);
	} else {
		initFormValidation();
	}

	// Работа с ползунками
	const formatNumber = (num) => {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	};

	const updateSliderProgress = (slider) => {
		const min = parseFloat(slider.min);
		const max = parseFloat(slider.max);
		const value = parseFloat(slider.value);
		const percent = ((value - min) / (max - min)) * 100;
		slider.style.background = `linear-gradient(to right, var(--color-red) 0%, var(--color-red) ${percent}%, #003964 ${percent}%, #003964 100%)`;
	};

	// Расчет калькулятора ломбарда
	const calculateLombard = () => {
		const amountSlider = document.getElementById('amount-slider');
		const termSlider = document.getElementById('term-slider');
		const monthPayEl = document.getElementById('mounth-pay');
		const percentEl = document.getElementById('order-precent');

		if (!amountSlider || !termSlider || !monthPayEl || !percentEl) return;

		const amount = parseFloat(amountSlider.value);
		const term = parseFloat(termSlider.value);

		// Минимальная ставка в месяц (от 2%)
		const minRate = 2;
		
		// Расчет минимального ежемесячного платежа
		// Формула: процент от суммы + часть основного долга
		const monthlyRate = amount * (minRate / 100); // Процент за месяц
		const principalPart = amount / term; // Часть основного долга
		const monthlyPayment = monthlyRate + principalPart;

		// Обновляем значения
		monthPayEl.textContent = formatNumber(Math.round(monthlyPayment));
		percentEl.textContent = minRate;
	};

	// Расчет калькулятора рефинансирования
	const calculateRefin = () => {
		const amountDebitSlider = document.getElementById('amount-debit-slider');
		const amountSlider = document.getElementById('amount-slider');
		const termSlider = document.getElementById('term-slider');
		const monthPayEl = document.getElementById('mounth-pay');
		const percentEl = document.getElementById('order-precent');
		const amountAllSumEl = document.getElementById('amount-all-sum');

		if (!amountDebitSlider || !amountSlider || !termSlider) return;

		const amountDebit = parseFloat(amountDebitSlider.value);
		const amountPersonal = parseFloat(amountSlider.value);
		const term = parseFloat(termSlider.value);
		const totalAmount = amountDebit + amountPersonal;

		// Обновляем итоговую сумму займа
		if (amountAllSumEl) {
			amountAllSumEl.textContent = formatNumber(Math.round(totalAmount));
		}

		// Минимальная ставка в месяц (от 2%)
		const minRate = 2;

		// Расчет минимального ежемесячного платежа
		// Формула: процент от общей суммы + часть основного долга
		const monthlyRate = totalAmount * (minRate / 100); // Процент за месяц
		const principalPart = totalAmount / term; // Часть основного долга
		const monthlyPayment = monthlyRate + principalPart;

		// Обновляем значения калькулятора
		if (monthPayEl) {
			monthPayEl.textContent = formatNumber(Math.round(monthlyPayment));
		}
		if (percentEl) {
			percentEl.textContent = minRate;
		}
	};

	const initSliders = () => {
		// Определяем тип калькулятора
		const calcElement = document.querySelector('[data-calc]');
		const calcType = calcElement ? calcElement.getAttribute('data-calc') : 'lombard';

		// Ползунок суммы долга (только для рефинансирования)
		const amountDebitSlider = document.getElementById('amount-debit-slider');
		const amountDebitValue = document.getElementById('amount-debit-value');
		const amountDebitInput = document.getElementById('amount-debit-input');
		
		if (amountDebitSlider && amountDebitValue) {
			const updateAmountDebit = () => {
				const value = parseInt(amountDebitSlider.value);
				amountDebitValue.textContent = `${formatNumber(value)} ₽`;
				if (amountDebitInput) amountDebitInput.value = value;
				updateSliderProgress(amountDebitSlider);
				if (calcType === 'refin') calculateRefin();
			};
			
			amountDebitSlider.addEventListener('input', updateAmountDebit);
			updateAmountDebit(); // Инициализация
		}

		// Ползунок суммы (для ломбарда) или на личные нужды (для рефинансирования)
		const amountSlider = document.getElementById('amount-slider');
		const amountValue = document.getElementById('amount-value');
		const amountInput = document.getElementById('amount-input');
		
		if (amountSlider && amountValue) {
			const updateAmount = () => {
				const value = parseInt(amountSlider.value);
				amountValue.textContent = `${formatNumber(value)} ₽`;
				if (amountInput) amountInput.value = value;
				updateSliderProgress(amountSlider);
				if (calcType === 'refin') {
					calculateRefin();
				} else {
					calculateLombard();
				}
			};
			
			amountSlider.addEventListener('input', updateAmount);
			updateAmount(); // Инициализация
		}

		// Ползунок срока
		const termSlider = document.getElementById('term-slider');
		const termValue = document.getElementById('term-value');
		const termInput = document.getElementById('term-input');
		
		if (termSlider && termValue) {
			const updateTerm = () => {
				const value = parseInt(termSlider.value);
				let months = 'мес.';
				
				termValue.textContent = `${value} ${months}`;
				if (termInput) termInput.value = value;
				updateSliderProgress(termSlider);
				if (calcType === 'refin') {
					calculateRefin();
				} else {
					calculateLombard();
				}
			};
			
			termSlider.addEventListener('input', updateTerm);
			updateTerm(); // Инициализация
		}

		// Инициализация калькулятора
		if (calcType === 'refin') {
			calculateRefin();
		} else {
			calculateLombard();
		}
	};

	// Инициализация ползунков
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initSliders);
	} else {
		initSliders();
	}

	// Загрузка фотографий
	const uploadedFiles = new Map(); // Хранилище загруженных файлов

	const updateAddButtonText = (addBtn) => {
		if (!addBtn) return;
		if (uploadedFiles.size > 0) {
			addBtn.textContent = 'Загрузить ещё фото';
		} else {
			addBtn.textContent = 'Загрузить фото договора';
		}
	};

	const initPhotoUpload = () => {
		const container = document.querySelector('.upload_photos-container');
		if (!container) return;

		const itemsContainer = container.querySelector('.upload_photos-items');
		const addBtn = container.querySelector('.upload_photos-add-btn');
		const fileInput = container.querySelector('#upload-photos-input');

		if (!itemsContainer || !addBtn || !fileInput) return;

		// Устанавливаем начальный текст кнопки
		updateAddButtonText(addBtn);

		// Обработчик клика на кнопку добавления
		addBtn.addEventListener('click', () => {
			fileInput.click();
		});

		// Обработчик выбора файлов
		fileInput.addEventListener('change', (e) => {
			const files = Array.from(e.target.files);
			files.forEach(file => {
				if (file.type.startsWith('image/')) {
					addPhotoItem(file, itemsContainer, addBtn);
				}
			});
			// Очищаем input для возможности повторной загрузки тех же файлов
			fileInput.value = '';
		});
	};

	const addPhotoItem = (file, container, addBtn) => {
		const fileId = Date.now() + Math.random();
		uploadedFiles.set(fileId, file);

		// Создаем элемент для файла
		const item = document.createElement('div');
		item.className = 'upload_photos-item';
		item.dataset.fileId = fileId;

		// Название файла
		const title = document.createElement('div');
		title.className = 'upload_photos-item__title';
		title.textContent = file.name;

		// Кнопка удаления
		const deleteBtn = document.createElement('button');
		deleteBtn.className = 'upload_photos-item__delete';
		deleteBtn.type = 'button';
		deleteBtn.textContent = 'Удалить';
		deleteBtn.addEventListener('click', () => {
			removePhotoItem(fileId, item);
		});

		item.appendChild(title);
		item.appendChild(deleteBtn);
		container.appendChild(item);
		
		// Обновляем текст кнопки
		updateAddButtonText(addBtn);
		
		// Обновляем проверку формы
		const form = container.closest('.order-form-wrapper');
		if (form) {
			updateFormButton(form);
		}
	};

	const removePhotoItem = (fileId, item) => {
		// Находим форму ДО удаления элемента
		const form = item.closest('.order-form-wrapper');
		
		uploadedFiles.delete(fileId);
		item.remove();
		
		// Обновляем текст кнопки
		const addBtn = document.querySelector('.upload_photos-add-btn');
		updateAddButtonText(addBtn);
		
		// Обновляем проверку формы с небольшой задержкой для обновления DOM
		if (form) {
			setTimeout(() => {
				updateFormButton(form);
			}, 0);
		}
	};

	// Функция для получения всех загруженных файлов
	window.getUploadedPhotos = () => {
		return Array.from(uploadedFiles.values());
	};

	// Обработка отправки формы с файлами
	const handleFormSubmit = () => {
		const form = document.querySelector('.order-form-wrapper');
		if (!form) return;

		form.addEventListener('submit', (e) => {
			// Добавляем все загруженные фотографии в форму
			uploadedFiles.forEach((file) => {
				// Создаем временный input для каждого файла
				const input = document.createElement('input');
				input.type = 'file';
				input.name = 'photos[]';
				input.style.display = 'none';
				
				// Создаем DataTransfer для добавления файла
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				input.files = dataTransfer.files;
				
				form.appendChild(input);
			});
		});
	};

	// Инициализация загрузки фотографий
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			initPhotoUpload();
			handleFormSubmit();
		});
	} else {
		initPhotoUpload();
		handleFormSubmit();
	}

	// Таймер SMS-кода
	const initSMSTimer = () => {
		const smsContainer = document.querySelector('.sms-input-container');
		if (!smsContainer) return;

		const timeCount = smsContainer.querySelector('.sms-time__count');
		const timeText = smsContainer.querySelector('.sms-time');
		const resendBtn = smsContainer.querySelector('.send-time');

		if (!timeCount || !timeText || !resendBtn) return;

		let timeLeft = 120; // 2 минуты в секундах
		let timerInterval = null;

		const formatTime = (seconds) => {
			const minutes = Math.floor(seconds / 60);
			const secs = seconds % 60;
			return `${minutes}:${secs.toString().padStart(2, '0')}`;
		};

		const updateTimer = () => {
			if (timeLeft > 0) {
				timeCount.textContent = formatTime(timeLeft);
				timeLeft--;
			} else {
				clearInterval(timerInterval);
				timeText.style.display = 'none';
				resendBtn.style.display = 'block';
			}
		};

		const startTimer = () => {
			timeLeft = 120;
			timeText.style.display = 'block';
			resendBtn.style.display = 'none';
			timeCount.textContent = formatTime(timeLeft);
			
			if (timerInterval) clearInterval(timerInterval);
			timerInterval = setInterval(updateTimer, 1000);
			updateTimer(); // Первое обновление сразу
		};

		// Обработчик клика на кнопку повторной отправки
		resendBtn.addEventListener('click', (e) => {
			e.preventDefault();
			startTimer();
			// Здесь можно добавить логику отправки SMS
		});

		// Запускаем таймер при загрузке
		startTimer();
	};

	// Инициализация таймера SMS
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initSMSTimer);
	} else {
		initSMSTimer();
	}

	// Загрузка фото паспорта
	const initPassportUpload = () => {
		// Находим все контейнеры загрузки фото
		const uploadContainers = document.querySelectorAll('.photo-upload-container');
		
		uploadContainers.forEach((container) => {
			const fileInput = container.querySelector('.photo-upload-input') || container.querySelector('#pasport-photo-input');
			const imgWrapper = container.querySelector('.photo-upload-img__wrapper');
			const previewImg = container.querySelector('.photo-upload-preview');
			const deleteBtn = container.querySelector('.photo-upload-delete');
			const shotBtn = container.querySelector('.photo-upload-btn_shot');
			const mediaBtn = container.querySelector('.photo-upload-btn_media');
			const uploadBtns = container.querySelector('.photo-upload-btns');

			if (!fileInput || !imgWrapper || !previewImg || !deleteBtn) return;

			// Сохраняем исходный src изображения в data-атрибут (если еще не сохранен)
			if (!previewImg.dataset.originalSrc) {
				previewImg.dataset.originalSrc = previewImg.src;
			}

			// Обработчик выбора файла
			fileInput.addEventListener('change', (e) => {
				const file = e.target.files[0];
				if (file && file.type.startsWith('image/')) {
					const reader = new FileReader();
					reader.onload = (event) => {
						previewImg.src = event.target.result;
						imgWrapper.classList.add('has-photo');
						deleteBtn.style.display = 'flex';
						
						// Скрываем кнопки загрузки
						if (uploadBtns) {
							uploadBtns.classList.add('--hidden');
						}
						
						// Обновляем проверку формы
						const form = fileInput.closest('.order-form-wrapper');
						if (form) {
							updateFormButton(form);
						}
					};
					reader.readAsDataURL(file);
				}
			});

			// Обработчик кнопки "Сделать фото"
			if (shotBtn) {
				shotBtn.addEventListener('click', () => {
					// Для мобильных устройств можно использовать capture="camera"
					fileInput.setAttribute('capture', 'environment');
					fileInput.click();
					fileInput.removeAttribute('capture');
				});
			}

			// Обработчик кнопки "Загрузить из галереи"
			if (mediaBtn) {
				mediaBtn.addEventListener('click', () => {
					fileInput.removeAttribute('capture');
					fileInput.click();
				});
			}

			// Обработчик кнопки удаления
			deleteBtn.addEventListener('click', () => {
				// Берем исходный src из data-атрибута
				const originalImageSrc = previewImg.dataset.originalSrc || previewImg.src;
				previewImg.src = originalImageSrc;
				imgWrapper.classList.remove('has-photo');
				deleteBtn.style.display = 'none';
				fileInput.value = '';
				
				// Показываем кнопки загрузки
				if (uploadBtns) {
					uploadBtns.classList.remove('--hidden');
				}
				
				// Обновляем проверку формы
				const form = fileInput.closest('.order-form-wrapper');
				if (form) {
					updateFormButton(form);
				}
			});
		});
	};

	// Инициализация загрузки фото паспорта
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initPassportUpload);
	} else {
		initPassportUpload();
	}

	// Работа с модалкой
	const OVERFLOW_HIDDEN_CLASS = 'overflow-hidden';

	const openModal = () => {
		const modalOverlay = document.querySelector('.modal-overlay');
		if (!modalOverlay) return;
		modalOverlay.classList.add('is-visible');
		document.body.classList.add(OVERFLOW_HIDDEN_CLASS);
	};

	const closeModal = () => {
		const modalOverlay = document.querySelector('.modal-overlay');
		if (!modalOverlay) return;
		modalOverlay.classList.remove('is-visible');
		document.body.classList.remove(OVERFLOW_HIDDEN_CLASS);
	};

	// Инициализация модалки
	const initModal = () => {
		const modalOverlay = document.querySelector('.modal-overlay');
		const modalClose = document.querySelector('.modal-close');
		
		if (!modalOverlay) return;

		// Закрытие по клику на кнопку закрытия
		if (modalClose) {
			modalClose.addEventListener('click', closeModal);
		}

		// Закрытие по клику на overlay (но не на content)
		modalOverlay.addEventListener('click', (e) => {
			if (e.target === modalOverlay) {
				closeModal();
			}
		});

		// Закрытие по Escape
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				const modalOverlay = document.querySelector('.modal-overlay');
				if (modalOverlay && modalOverlay.classList.contains('is-visible')) {
					closeModal();
				}
			}
		});
	};

	// Делаем функции глобальными для использования в onclick
	window.openModal = openModal;
	window.closeModal = closeModal;

	// Инициализация модалки
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initModal);
	} else {
		initModal();
	}

	// Маска для телефонного номера
	const applyPhoneMask = (input) => {
		if (!input) return;

		// Функция форматирования телефона
		const formatPhone = (value) => {
			// Удаляем все нецифровые символы
			let digits = value.replace(/\D/g, '');
			
			// Если начинается с 8, заменяем на 7
			if (digits.startsWith('8')) {
				digits = '7' + digits.slice(1);
			} else if (!digits.startsWith('7') && digits.length > 0) {
				digits = '7' + digits;
			}

			// Ограничиваем до 11 цифр (7 + 10)
			if (digits.length > 11) {
				digits = digits.slice(0, 11);
			}

			// Форматируем в +7 (XXX) XXX-XX-XX
			if (digits.length === 0) {
				return '+7';
			}

			let formatted = '+7';
			if (digits.length > 1) {
				const code = digits.slice(1, 4);
				const part1 = digits.slice(4, 7);
				const part2 = digits.slice(7, 9);
				const part3 = digits.slice(9, 11);

				if (code) {
					formatted += ` (${code}`;
					if (part1) {
						formatted += `) ${part1}`;
						if (part2) {
							formatted += `-${part2}`;
							if (part3) {
								formatted += `-${part3}`;
							}
						}
					} else {
						formatted += ')';
					}
				}
			}

			return formatted;
		};

		// Обработчик фокуса - добавляем +7 если поле пустое
		const handleFocus = () => {
			if (!input.value || input.value === '+7') {
				input.value = '+7';
				input.setSelectionRange(2, 2);
			}
			// Отмечаем, что поле было в фокусе
			input.dataset.wasFocused = 'true';
		};
		
		// Обработчик потери фокуса - проверяем валидность
		const handleBlur = () => {
			validatePhoneField(input, true);
			const form = input.closest('form') || input.closest('.order-form-wrapper');
			if (form) {
				const button = form.querySelector('.order__btn-next');
				if (button) {
					const isValid = checkForm(form);
					button.disabled = !isValid;
				}
			}
		};

		// Обработчик ввода
		const handleInput = (e) => {
			const cursorPosition = input.selectionStart;
			const oldValue = input.value;
			
			// Если поле пустое или только +7, начинаем с +7
			if (!oldValue || oldValue === '+7') {
				input.value = '+7';
			}
			
			const newValue = formatPhone(input.value);
			input.value = newValue;

			// Восстанавливаем позицию курсора
			let newCursorPosition = cursorPosition;
			if (oldValue.length !== newValue.length) {
				// Вычисляем количество цифр до курсора в старом значении
				const digitsBefore = oldValue.slice(0, cursorPosition).replace(/\D/g, '').length;
				let count = 0;
				for (let i = 0; i < newValue.length && count < digitsBefore; i++) {
					if (/\d/.test(newValue[i])) {
						count++;
					}
					newCursorPosition = i + 1;
				}
				// Минимальная позиция - после +7
				if (newCursorPosition < 2) {
					newCursorPosition = 2;
				}
			}

			input.setSelectionRange(newCursorPosition, newCursorPosition);
			
			// Проверяем валидность телефона и обновляем визуальное состояние
			const form = input.closest('form') || input.closest('.order-form-wrapper');
			if (form) {
				validatePhoneField(input);
				// Обновляем состояние кнопки формы
				const button = form.querySelector('.order__btn-next');
				if (button) {
					const isValid = checkForm(form);
					button.disabled = !isValid;
				}
			}
		};

		// Обработчик вставки
		const handlePaste = (e) => {
			e.preventDefault();
			const pastedText = (e.clipboardData || window.clipboardData).getData('text');
			const formatted = formatPhone(pastedText);
			input.value = formatted;
			
			// Устанавливаем курсор в конец
			input.setSelectionRange(formatted.length, formatted.length);
			
			// Проверяем валидность телефона и обновляем визуальное состояние
			const form = input.closest('form') || input.closest('.order-form-wrapper');
			if (form) {
				validatePhoneField(input);
				// Обновляем состояние кнопки формы
				const button = form.querySelector('.order__btn-next');
				if (button) {
					const isValid = checkForm(form);
					button.disabled = !isValid;
				}
			}
		};

		// Обработчик удаления (Backspace/Delete)
		const handleKeyDown = (e) => {
			// Разрешаем удаление и навигацию
			if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
				(e.keyCode === 65 && e.ctrlKey === true) || // Ctrl+A
				(e.keyCode >= 35 && e.keyCode <= 40)) { // Home, End, стрелки
				// Если нажали Backspace и курсор на позиции 2 (после +7), предотвращаем удаление
				if (e.keyCode === 8 && input.selectionStart <= 2) {
					e.preventDefault();
					return;
				}
				return;
			}
			
			// Разрешаем Ctrl+C, Ctrl+V, Ctrl+X
			if ((e.ctrlKey === true || e.metaKey === true) && [67, 86, 88].indexOf(e.keyCode) !== -1) {
				return;
			}

			// Разрешаем только цифры
			if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
				e.preventDefault();
			}
		};

		// Применяем обработчики
		input.addEventListener('focus', handleFocus);
		input.addEventListener('blur', handleBlur);
		input.addEventListener('input', handleInput);
		input.addEventListener('paste', handlePaste);
		input.addEventListener('keydown', handleKeyDown);

		// Инициализация: форматируем текущее значение, если оно есть
		if (input.value) {
			input.value = formatPhone(input.value);
		} else {
			input.value = '+7';
		}
	};

	// Инициализация масок для всех полей телефона
	const initPhoneMasks = () => {
		// Находим все поля с placeholder для телефона
		const phoneInputs = document.querySelectorAll('input[placeholder*="+7"], input[name="tel"], input[type="tel"]');
		phoneInputs.forEach(input => {
			if (input.placeholder && input.placeholder.includes('+7')) {
				applyPhoneMask(input);
			}
		});
	};

	// Инициализация масок телефона
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initPhoneMasks);
	} else {
		initPhoneMasks();
	}
})();
