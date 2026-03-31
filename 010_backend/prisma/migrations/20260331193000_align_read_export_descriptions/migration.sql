UPDATE `Permission`
SET `description` = 'Termine ansehen und Ablauf exportieren'
WHERE `key` = 'events:read';

UPDATE `Permission`
SET `description` = 'Notenbestand ansehen und exportieren'
WHERE `key` = 'sheetMusic:read';