export const APP_CONFIG = {
    LANG: 'ru',
    STORAGE_KEYS: {
        PACKAGES: 'medicationPackages',
        COURSES: 'medicationCourses',
        INTAKES: 'medicationIntakes',
        SETTINGS: 'userSettings'
    },
    LABELS: {
        NAV: {
            HOME: 'Главная',
            CALENDAR: 'Календарь',
            COURSES: 'Курсы',
            PACKAGES: 'Упаковки'
        },
        HEADERS: {
            HOME: 'Сегодня',
            CALENDAR: 'Календарь приема',
            COURSES: 'Мои курсы',
            PACKAGES: 'Моя аптечка',
            SETTINGS: 'Настройки'
        },
        PLACEHOLDERS: {
            SECTION_DEV: 'Раздел в разработке',
            SEARCH: 'Поиск...',
            PKG_NAME: 'Название лекарства',
            PKG_DOSE: 'Дозировка (мг/мл)',
            PKG_QTY: 'Количество'
        },
        BUTTONS: {
            ADD_PKG: '+ Добавить упаковку',
            CLOSE_FORM: 'Скрыть форму',
            ADD: 'Добавить',
            SAVE: 'Сохранить упаковку',
            UPDATE: 'Обновить упаковку',
            CANCEL: 'Отмена',
            EDIT: 'Изменить',
            DELETE: 'Удалить',
            CONFIRM: 'Подтвердить',
            CONFIRM_DELETE: 'Удалить эту упаковку?',
            CREATE_COURSE: 'Создать курс',
            EXTENDED: '▼ Дополнительно',
            HIDE_EXTENDED: '▲ Свернуть'
        },
        FORM: {
            EXTENDED: {
                CATEGORY: 'Категория',
                QTY_PER_PKG: 'Количество в упаковке',
                TYPE: 'Форма выпуска',
                SUBSTANCE: 'Действующее вещество',
                DISPLAY_NAME: 'Отображаемое название',
                STOCK: 'Текущий остаток',
                INDICATIONS: 'Показания',
                COMMENT: 'Комментарий',
                OPTIONAL: 'Необязательно',
                AUTO_FILL: 'Авто',
                AUTO_FILL_TIP: 'Формируется из: Торговое название + Дозировка + Количество + Вещество'
            },
            TRADE_NAME: 'Торговое название',
            DOSAGE: 'Дозировка',
            UNIT: 'Ед. изм.',
            UNITS: {
                MG: 'мг',
                ML: 'мл',
                TAB: 'таб',
                CAP: 'капс',
                PCS: 'шт',
                ME: 'МЕ',
                OTHER: 'другое'
            }
        },
        MESSAGES: {
            NO_DATA: 'Нет данных',
            SAVED: 'Сохранено успешно',
            UPDATED: 'Обновлено',
            DELETED: 'Удалено',
            ERROR: 'Произошла ошибка',
            VALIDATION_ERROR: 'Заполните обязательные поля',
            NO_PACKAGES: 'Упаковки не добавлены',
            NO_PACKAGES_HINT: 'Нажмите кнопку выше, чтобы добавить первую упаковку',
            NO_INTAKES: 'Нет приёмов на этот день',
            SELECT_DATE: 'Выберите дату для просмотра',
            COURSE_SAVED: 'Курс сохранён',
            COURSE_UPDATED: 'Курс обновлён',
            COURSE_DELETED: 'Курс удалён',
            NO_COURSES: 'Курсы не добавлены',
            NO_COURSES_HINT: 'Создайте курс приёма лекарства',
            SELECT_PACKAGE: 'Сначала выберите упаковку',
            NO_PACKAGES_FOR_COURSE: 'Сначала добавьте упаковку в аптечку'
        },
        COURSE: {
            ADD_COURSE: '+ Добавить курс',
            CLOSE_FORM: '✕ Скрыть форму',
            SELECT_PACKAGE: 'Выберите упаковку',
            COURSE_NAME: 'Название курса',
            COURSE_NAME_PLACEHOLDER: 'Например: Курс витаминов',
            REMAINING: 'Осталось пропить по курсу',
            DATE_START: 'Дата начала',
            DATE_END: 'Дата окончания',
            LIFELONG: 'Бессрочный курс',
            SAVE: 'Сохранить курс',
            UPDATE: 'Обновить курс',
            CANCEL: 'Отмена',
            OPTIONAL: 'необязательно',
            AUTO_NAME: 'Авто',
            AUTO_NAME_TIP: 'Сформировать из названия препарата',
            SCHEDULE: {
                TITLE: 'Расписание приёма',
                TIME_SLOTS: 'Время приёма',
                MORNING: 'Утро',
                AFTERNOON: 'День',
                EVENING: 'Вечер',
                NIGHT: 'Ночь',
                EXACT_TIME: '+ Указать точное время',
                DOSE_PER_INTAKE: 'Доза на приём',
                INTERVAL_DAYS: 'Интервал (дней)',
                INTERVAL_HINT: '1 = каждый день',
                MEAL_CONDITION: 'Условия приёма',
                REMINDER: 'Напоминание',
                REMINDER_HINT: 'За сколько дней до окончания запаса',
                DIFFERENT_DOSES: 'Разное количество на приём...',
                SAME_DOSE: 'Одинаковая доза',
                DOSE_FOR: 'Доза на'
            }
        },
        MEAL_CONDITIONS: [
            { value: '', label: '— Не указано —' },
            { value: 'before', label: 'До еды' },
            { value: 'after', label: 'После еды' },
            { value: 'during', label: 'Во время еды' },
            { value: 'empty', label: 'Натощак' },
            { value: 'any', label: 'Независимо от еды' }
        ],
        REMINDER_OPTIONS: [
            { value: '0', label: 'Не напоминать' },
            { value: '3', label: 'За 3 дня' },
            { value: '5', label: 'За 5 дней' },
            { value: '7', label: 'За 7 дней' },
            { value: '14', label: 'За 14 дней' }
        ],
        HOME: {
            TITLE: 'Что нужно принять',
            WEEK_NAV: {
                PREV: '‹',
                NEXT: '›'
            },
            EMPTY: 'На этот день приёмов нет',
            EMPTY_HINT: 'Добавьте курс, чтобы увидеть расписание'
        },
        CALENDAR: {
            WEEKDAYS: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            MONTHS: [
                'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
            ],
            PREV: '◀',
            NEXT: '▶',
            TODAY: 'Сегодня',
            LEGEND: {
                TITLE: 'Обозначения',
                TODAY: 'Сегодня',
                SELECTED: 'Выбранный день'
            },
            ACTIONS: {
                TITLE: 'Действия',
                VIEW_DAY: 'Просмотр дня',
                ADD_COURSE: 'Добавить курс'
            },
            DAY_VIEW: {
                PREV_DAY: '←',
                NEXT_DAY: '→',
                NO_INTAKES: 'В этот день приёмов не запланировано',
                SCHEDULE_LINK: 'запланировать приём',
                BACK_HOME: 'Вернуться на Главную',
                BACK_CALENDAR: 'Вернуться к календарю'
            }
        }
    }
};