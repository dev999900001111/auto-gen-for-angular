// Date, Time, DateTimeの場合は、@Column(columnDefinition)を付与
const TIME_TYPE_REMAP: { [key: string]: string } = {
    Date: 'LocalDate',
    Time: 'LocalTime',
    DateTime: 'LocalDateTime',
    Timestamp: 'LocalDateTime',
    LocalDate: 'LocalDate',
    LocalTime: 'LocalTime',
    LocalDateTime: 'LocalDateTime',
};
const TIME_TYPE_COLUMN_DEFINITION: { [key: string]: string } = {
    LocalDate: 'DATE',
    LocalTime: 'TIME',
    LocalDateTime: 'TIMESTAMP',
};

export function toGoClass(type: string): string {
    type = type || 'void';

    // if (type.startsWith('list[')) {
    //     type = type.replace('list[', 'List<').replace(']', '>')
    //     return type;
    // } else { }
    // if (type.endsWith('[]') || type.endsWith('<>') || type.endsWith('[>')) {
    //     type = `List<${toGoClass(type.substring(0, type.length - 2))}>`;
    //     return type;
    // } else { }
    // TODO ちょっと雑過ぎるのでそのうち見直したい。
    type = type
        .replace('list[', '[]').replace(']', '')
        .replace('List<', '[]').replace('>', '')
        .replace(/^[Ss]tring$/, 'string')
        .replace(/^[Ii]nt$/, 'int32')
        .replace(/^[Dd]ate$/, 'time.Time')
        .replace(/^[tT]ime$/, 'time.Time')
        .replace(/^[tT]imestamp$/, 'time.Time')
        .replace(/^[bB]oolean$/, 'boolean')
        .replace(/^[Ff]loat$/, 'float32')
        .replace(/^[Dd]ouble$/, 'float64')
        .replace(/^[Ll]ong$/, 'int64')
        .replace(/^[sS]hort$/, 'int32')
        .replace(/^[bB]yte$/, 'byte')
        // .replace(/^char$/, 'Character')
        .replace(/^void$/, 'Void')
        // .replace(/^object$/, 'Object')
        // .replace(/^Object$/, 'byte[]')
        .replace(/^[iI]nteger$/, 'int32')
        .replace(/^[Nn]umber$/, 'int64')
        .replace(/^[Bb]ig[Ii]nteger$/, 'int64')
        .replace(/^[Bb]ig[Dd]ecimal$/, 'float64')
        .replace(/^[Ll]ocaldate$/, 'time.Time')
        .replace(/^[Ll]ocaltime$/, 'time.Time')
        .replace(/^[Ll]ocaldatetime$/, 'time.Time')
        .replace(/^[Zz]oneddatetime$/, 'time.Time')
        .replace(/^[Oo]ffsetdatetime$/, 'time.Time')
        .replace(/^[Oo]ffsettime$/, 'time.Time')
        // .replace(/^blob$/, 'Blob')
        // .replace(/^clob$/, 'Clob')
        // .replace(/^array$/, 'Array')
        // .replace(/^ref$/, 'Ref')
        // .replace(/^url$/, 'URL')
        // .replace(/^uri$/, 'URI')
        // .replace(/^uuid$/, 'UUID')
        // .replace(/^timeuuid$/, 'TimeUUID')
        // .replace(/^inetaddress$/, 'InetAddress')
        // .replace(/^file$/, 'File')
        // .replace(/^path$/, 'Path')
        // .replace(/^class$/, 'Class')
        // .replace(/^locale$/, 'Locale')
        // .replace(/^currency$/, 'Currency')
        // .replace(/^timezone$/, 'TimeZone')
        // .replace(/^simpledateformat$/, 'SimpleDateFormat')
        // .replace(/^datetimeformatter$/, 'DateTimeFormatter')
        // .replace(/^datetimeformat$/, 'DateTimeFormat')
        // .replace(/^datetimeformatterbuilder$/, 'DateTimeFormatterBuilder')
        // .replace(/^periodformatter$/, 'PeriodFormatter')
        // .replace(/^periodformatterbuilder$/, 'PeriodFormatterBuilder')
        // .replace(/^periodformat$/, 'PeriodFormat')
        ;
    type = TIME_TYPE_REMAP[type] || type;
    return type;
}

