export interface District {
  id: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
  districts: District[];
}

export const regions: Region[] = [
  {
    id: 'andijon',
    name: 'Andijon viloyati',
    districts: [
      { id: 'andijon', name: 'Andijon' },
      { id: 'asaka', name: 'Asaka' },
      { id: 'balikchi', name: 'Balikchi' },
      { id: 'buloqboshi', name: 'Buloqboshi' },
      { id: 'boz', name: 'Bo\'z' },
      { id: 'jalaquduq', name: 'Jalaquduq' },
      { id: 'marhamat', name: 'Marhamat' },
      { id: 'oltinko\'l', name: 'Oltinko\'l' },
      { id: 'pakhtaobod', name: 'Pakhtaobod' },
      { id: 'qo\'rg\'ontepa', name: 'Qo\'rg\'ontepa' },
      { id: 'shahrixon', name: 'Shahrixon' },
      { id: 'ulugnor', name: 'Ulugnor' },
      { id: 'xo\'jaobod', name: 'Xo\'jaobod' },
      { id: 'izboskan', name: 'Izboskan' }
    ]
  },
  {
    id: 'buxoro',
    name: 'Buxoro viloyati',
    districts: [
      { id: 'buxoro', name: 'Buxoro' },
      { id: 'gijduvon', name: 'Gijduvon' },
      { id: 'jondor', name: 'Jondor' },
      { id: 'karakul', name: 'Karakul' },
      { id: 'kogon', name: 'Kogon' },
      { id: 'olot', name: 'Olot' },
      { id: 'peshku', name: 'Peshku' },
      { id: 'romitan', name: 'Romitan' },
      { id: 'shofirkon', name: 'Shofirkon' },
      { id: 'vobkent', name: 'Vobkent' }
    ]
  },
  {
    id: 'fargona',
    name: 'Farg\'ona viloyati',
    districts: [
      { id: 'bagdod', name: 'Bag\'dod' },
      { id: 'beshariq', name: 'Beshariq' },
      { id: 'buvayda', name: 'Buvayda' },
      { id: 'dangara', name: 'Dangara' },
      { id: 'fargona', name: 'Farg\'ona' },
      { id: 'furqat', name: 'Furqat' },
      { id: 'qo\'qon', name: 'Qo\'qon' },
      { id: 'quva', name: 'Quva' },
      { id: 'quvasoy', name: 'Quvasoy' },
      { id: 'rishton', name: 'Rishton' },
      { id: 'sox', name: 'Sox' },
      { id: 'toshloq', name: 'Toshloq' },
      { id: 'uchkuprik', name: 'Uchko\'prik' },
      { id: 'ush', name: 'Ush' },
      { id: 'yozyovon', name: 'Yozyovon' }
    ]
  },
  {
    id: 'jizzax',
    name: 'Jizzax viloyati',
    districts: [
      { id: 'aravan', name: 'Aravan' },
      { id: 'baxmal', name: 'Baxmal' },
      { id: 'do\'stlik', name: 'Do\'stlik' },
      { id: 'forish', name: 'Forish' },
      { id: 'gallaorol', name: 'Gallaorol' },
      { id: 'jizzax', name: 'Jizzax' },
      { id: 'mirzachol', name: 'Mirzachol' },
      { id: 'pakhtakor', name: 'Paxtakor' },
      { id: 'sharof-rasulov', name: 'Sharof Rashidov' },
      { id: 'yangiobod', name: 'Yangiobod' },
      { id: 'zarbdor', name: 'Zarbdor' },
      { id: 'zafarobod', name: 'Zafarobod' },
      { id: 'zomin', name: 'Zomin' }
    ]
  },
  {
    id: 'namangan',
    name: 'Namangan viloyati',
    districts: [
      { id: 'chortoq', name: 'Chortoq' },
      { id: 'chust', name: 'Chust' },
      { id: 'kosonsoy', name: 'Kosonsoy' },
      { id: 'mingbuloq', name: 'Mingbuloq' },
      { id: 'namangan', name: 'Namangan' },
      { id: 'norin', name: 'Norin' },
      { id: 'pop', name: 'Pop' },
      { id: 'to\'raqo\'rg\'on', name: 'To\'raqo\'rg\'on' },
      { id: 'uchqo\'rg\'on', name: 'Uchqo\'rg\'on' },
      { id: 'yangi-namangan', name: 'Yangi Namangan' },
      { id: 'yangikurgon', name: 'Yangikurgon' }
    ]
  },
  {
    id: 'navoiy',
    name: 'Navoiy viloyati',
    districts: [
      { id: 'konimex', name: 'Konimex' },
      { id: 'navbahor', name: 'Navbahor' },
      { id: 'navoiy', name: 'Navoiy' },
      { id: 'nurota', name: 'Nurota' },
      { id: 'qiziltepa', name: 'Qiziltepa' },
      { id: 'tomdi', name: 'Tomdi' },
      { id: 'uchquduq', name: 'Uchquduq' },
      { id: 'zarafshon', name: 'Zarafshon' }
    ]
  },
  {
    id: 'qashqadaryo',
    name: 'Qashqadaryo viloyati',
    districts: [
      { id: 'dehqonobod', name: 'Dehqonobod' },
      { id: 'guzor', name: 'G\'uzor' },
      { id: 'kasbi', name: 'Kasbi' },
      { id: 'kitob', name: 'Kitob' },
      { id: 'koson', name: 'Koson' },
      { id: 'mirishkor', name: 'Mirishkor' },
      { id: 'muborak', name: 'Muborak' },
      { id: 'nishon', name: 'Nishon' },
      { id: 'qamashi', name: 'Qamashi' },
      { id: 'qarshi', name: 'Qarshi' },
      { id: 'shahrisabz', name: 'Shahrisabz' },
      { id: 'yakkabog', name: 'Yakkabog' }
    ]
  },
  {
    id: 'samarqand',
    name: 'Samarqand viloyati',
    districts: [
      { id: 'bulungur', name: 'Bulungur' },
      { id: 'ishtixon', name: 'Ishtixon' },
      { id: 'jomboy', name: 'Jomboy' },
      { id: 'kattaqorgon', name: 'Kattaqo\'rg\'on' },
      { id: 'narpay', name: 'Narpay' },
      { id: 'nurobod', name: 'Nurobod' },
      { id: 'oqdaryo', name: 'Oqdaryo' },
      { id: 'payariq', name: 'Payariq' },
      { id: 'pastdargom', name: 'Pastdarg\'om' },
      { id: 'qoshrabot', name: 'Qoshrabot' },
      { id: 'samarqand', name: 'Samarqand' },
      { id: 'toyloq', name: 'Toyloq' },
      { id: 'urgut', name: 'Urgut' }
    ]
  },
  {
    id: 'sirdaryo',
    name: 'Sirdaryo viloyati',
    districts: [
      { id: 'boyovut', name: 'Boyovut' },
      { id: 'guliston', name: 'Guliston' },
      { id: 'mirzaobod', name: 'Mirzaobod' },
      { id: 'oqoltin', name: 'Oqoltin' },
      { id: 'sardoba', name: 'Sardoba' },
      { id: 'sayxunobod', name: 'Sayxunobod' },
      { id: 'sirdaryo', name: 'Sirdaryo' },
      { id: 'xovos', name: 'Xovos' }
    ]
  },
  {
    id: 'surxondaryo',
    name: 'Surxondaryo viloyati',
    districts: [
      { id: 'angor', name: 'Angor' },
      { id: 'bandixon', name: 'Bandixon' },
      { id: 'boysun', name: 'Boysun' },
      { id: 'denov', name: 'Denov' },
      { id: 'jarqorgon', name: 'Jarqo\'rg\'on' },
      { id: 'qiziriq', name: 'Qiziriq' },
      { id: 'qumqorgon', name: 'Qumqo\'rg\'on' },
      { id: 'muzrabot', name: 'Muzrabot' },
      { id: 'oltinsoy', name: 'Oltinsoy' },
      { id: 'sariosiyo', name: 'Sariosiyo' },
      { id: 'sherobod', name: 'Sherobod' },
      { id: 'shorchi', name: 'Sho\'rchi' },
      { id: 'termiz', name: 'Termiz' },
      { id: 'uzun', name: 'Uzun' }
    ]
  },
  {
    id: 'tashkent',
    name: 'Toshkent viloyati',
    districts: [
      { id: 'bekobod', name: 'Bekobod' },
      { id: 'bostanliq', name: 'Bostanliq' },
      { id: 'chinoz', name: 'Chinoz' },
      { id: 'qibray', name: 'Qibray' },
      { id: 'oqqorgon', name: 'Oqqo\'rg\'on' },
      { id: 'ohangaron', name: 'Ohangaron' },
      { id: 'parkent', name: 'Parkent' },
      { id: 'piskent', name: 'Piskent' },
      { id: 'quyi-chirchiq', name: 'Quyi Chirchiq' },
      { id: 'yangiyul', name: 'Yangiyul' },
      { id: 'yuqori-chirchiq', name: 'Yuqori Chirchiq' },
      { id: 'zangiota', name: 'Zangiota' }
    ]
  },
  {
    id: 'xorazm',
    name: 'Xorazm viloyati',
    districts: [
      { id: 'bogot', name: 'Bog\'ot' },
      { id: 'gurlan', name: 'Gurlan' },
      { id: 'hazorasp', name: 'Hazorasp' },
      { id: 'khiva', name: 'Xiva' },
      { id: 'shovot', name: 'Shovot' },
      { id: 'urganch', name: 'Urganch' },
      { id: 'yangiariq', name: 'Yangiariq' },
      { id: 'yangibozor', name: 'Yangibozor' }
    ]
  }
];
