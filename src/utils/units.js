export const UNIT_LABELS_UK = {
    tablets:  'таблетки',
    capsules: 'капсули',
    ml:       'мл',
    mg:       'мг',
    g:        'г',
    drops:    'краплі',
    patches:  'пластирі',
    tubes:    'туби',
    ampoules: 'ампули',
};

export const UNITS = [
    { value: 'tablets',  label: 'таблетки' },
    { value: 'capsules', label: 'капсули' },
    { value: 'ml',       label: 'мл' },
    { value: 'mg',       label: 'мг' },
    { value: 'g',        label: 'г' },
    { value: 'drops',    label: 'краплі' },
    { value: 'patches',  label: 'пластирі' },
    { value: 'tubes',    label: 'туби' },
    { value: 'ampoules', label: 'ампули' },
];

/** Returns a Ukrainian display label for a DB unit string (e.g. "tablets" → "таблетки") */
export const displayUnit = (unit) => UNIT_LABELS_UK[unit] || unit || 'одиниць';
