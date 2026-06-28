export type SpeakerTag = "мужчина" | "женщина" | "прохождение шагов" | "семинар" | "служение"

export type Speaker = {
	speaker: string
	title: string
	code: string
	ext: "m4a" | "mp3" | "ogg" | null
	tags: SpeakerTag[]
}

export const SPEAKER_TAGS: SpeakerTag[] = ["женщина", "мужчина", "прохождение шагов", "семинар", "служение"]

export const CLOUD_BASE = "https://cloud.mail.ru/public/HiPW/fRDrvxMRE"

export const SPEAKERS: Speaker[] = [
	{ speaker: "Евгений Н. (г.Чебоксары)", title: "Как я избавился от интернет-зависимости",                                                               code: "evgeniy_n_1",          ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Стас",                      title: "—",                                                                                                      code: "stas_1",               ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Tomas",                     title: "—",                                                                                                      code: "tomas_1",              ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Марат",                     title: "—",                                                                                                      code: "marat_1",              ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Дина",                      title: "—",                                                                                                      code: "dina_1",               ext: "m4a",  tags: ["женщина"]                               },
	{ speaker: "—",                         title: "Семинар 03.05.22",                                                                                       code: "seminar_1",            ext: "m4a",  tags: ["семинар"]                               },
	{ speaker: "—",                         title: "Семинар по границам — Часть #1",                                                                         code: "seminar_boundaries_1", ext: "m4a",  tags: ["семинар"]                               },
	{ speaker: "—",                         title: "Семинар по границам — Часть #2",                                                                         code: "seminar_boundaries_2", ext: "m4a",  tags: ["семинар"]                               },
	{ speaker: "Демьян",                    title: "—",                                                                                                      code: "demyan_1",             ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Сергей",                    title: "Опыт программы",                                                                                         code: "sergey_1",             ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Эвелина Р.",               title: "Служение — неотъемлемая часть выздоровления",                                                            code: "evelina_r_1",          ext: "m4a",  tags: ["женщина", "служение"]                   },
	{ speaker: "Сергей",                    title: "Опыт выздоровления",                                                                                     code: "sergey_2",             ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Татьяна",                   title: "Что такое болезнь и выздоровление",                                                                      code: "tatyana_1",            ext: "m4a",  tags: ["женщина"]                               },
	{ speaker: "Татьяна",                   title: "Открытия во время прохождения программы",                                                                code: "tatyana_2",            ext: "m4a",  tags: ["женщина", "прохождение шагов"]          },
	{ speaker: "Катя",                      title: "Прогресс, а не совершенство",                                                                            code: "katya_1",              ext: "m4a",  tags: ["женщина"]                               },
	{ speaker: "Сергей",                    title: "Опыт применения инструмента границы",                                                                    code: "sergey_3",             ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Стас",                      title: "История создания сообщества АИЗ",                                                                        code: "stas_2",               ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Евгений",                   title: "Первая и пятая традиции",                                                                                code: "evgeniy_1",            ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Стас",                      title: "Вторая традиция",                                                                                        code: "stas_3",               ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Даниил",                    title: "Инструменты выздоровления",                                                                              code: "daniil_1",             ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "—",                         title: "Интервью с интернет-зависимым: зависимость от телефона, игр, новостей",                                  code: "interview_1",          ext: "m4a",  tags: []                                        },
	{ speaker: "—",                         title: "Первый шаг. Глава БКАА «Ещё об алкоголизме» в прочтении для АИЗ",                                       code: "reading_bkaa_1",       ext: "m4a",  tags: ["прохождение шагов"]                     },
	{ speaker: "Татьяна (Кемерово)",        title: "Шаги в повседневной жизни",                                                                              code: "tatyana_kemerovo_1",   ext: "ogg",  tags: ["женщина", "прохождение шагов"]          },
	{ speaker: "Настя",                     title: "Опыт служения Ведущим собрания и его влияние на личное выздоровление",                                   code: "nastya_1",             ext: "mp3",  tags: ["женщина", "служение"]                   },
	{ speaker: "Демьян",                    title: "Служение",                                                                                               code: "demyan_2",             ext: "mp3",  tags: ["мужчина", "служение"]                   },
	{ speaker: "Салима",                    title: "Как изменилась жизнь после прохождения шагов",                                                           code: "salima_1",             ext: "ogg",  tags: ["женщина", "прохождение шагов"]          },
	{ speaker: "Демьян",                    title: "Здоровые границы",                                                                                       code: "demyan_3",             ext: "ogg",  tags: ["мужчина"]                               },
	{ speaker: "Станислав",                 title: "Начало служения в сообществе: как начать, для чего это и что это значит на практике",                    code: "stanislav_1",          ext: "ogg",  tags: ["мужчина", "служение"]                   },
	{ speaker: "Татьяна Ш.",               title: "О выздоровлении от интернет-зависимости",                                                                code: "tatyana_sh_1",         ext: "ogg",  tags: ["женщина"]                               },
	{ speaker: "Наталья",                   title: "Прохождение шагов в малой группе со спонсором",                                                          code: "natalya_1",            ext: "mp3",  tags: ["женщина", "прохождение шагов"]          },
	{ speaker: "Даниил",                    title: "Выздоровление в АИЗ",                                                                                    code: "daniil_2",             ext: "mp3",  tags: ["мужчина"]                               },
	{ speaker: "Алена и Алексей",           title: "Опыт прохождения 12-ти шагов Медиа Зависимых, 1-й месяц",                                               code: "alena_aleksey_1",      ext: "ogg",  tags: ["мужчина", "женщина", "прохождение шагов"] },
	{ speaker: "Станислав",                 title: "Первые шаги в АИЗ",                                                                                      code: "stanislav_2",          ext: "mp3",  tags: ["мужчина", "прохождение шагов"]          },
	{ speaker: "Алексей",                   title: "Опыт прохождения шагов в малой группе со спонсором",                                                     code: "aleksey_1",            ext: "mp3",  tags: ["мужчина", "прохождение шагов"]          },
	{ speaker: "Евгений",                   title: "Опыт прохождения шагов в малой группе со спонсором",                                                     code: "evgeniy_2",            ext: "mp3",  tags: ["мужчина", "прохождение шагов"]          },
	{ speaker: "Анастасия",                 title: "12 шагов за 3 месяца по программе Сергея П. — Анализ причин успеха в выздоровлении, часть 1",            code: "anastasiya_1",         ext: null,   tags: ["женщина", "прохождение шагов"]          },
	{ speaker: "Настя",                     title: "—",                                                                                                      code: "nastya_2",             ext: "mp3",  tags: ["женщина"]                               },
	{ speaker: "Анастасия",                 title: "12 шагов за 3 месяца по программе Сергея П. — Анализ причин успеха в выздоровлении, часть 2",            code: "anastasiya_2",         ext: "mp3",  tags: ["женщина", "прохождение шагов"]          },
	{ speaker: "Александра",                title: "Выздоровление от интернет-зависимости в АИЗ: что было, что стало",                                       code: "aleksandra_1",         ext: "ogg",  tags: ["женщина", "прохождение шагов"]          },
	{ speaker: "Маргарита",                 title: "Опыт прохождения программы 12 шагов в сообществе АИЗ",                                                   code: "margarita_1",          ext: "ogg",  tags: ["женщина", "прохождение шагов"]          },
	{ speaker: "Дмитрий",                   title: "Опыт прохождения 12 шагов в малой группе со спонсором",                                                  code: "dmitriy_1",            ext: "mp3",  tags: ["мужчина", "прохождение шагов"]          },
	{ speaker: "Сергей",                    title: "Моё выздоровление от интернет-зависимости",                                                              code: "sergey_4",             ext: "m4a",  tags: ["мужчина"]                               },
	{ speaker: "Татьяна Ш.",               title: "Инструменты трезвости в интернет-зависимости, как их вижу я",                                            code: "tatyana_sh_2",         ext: "m4a",  tags: ["женщина"]                               },
	{ speaker: "Дмитрий",                   title: "1 год в программе",                                                                                      code: "dmitriy_2",            ext: "m4a",  tags: ["мужчина"]                               },
]
