// Add dotpath ids here to hide them from the UI, while
// still counting them in the flow/progress and including in export.
// Example: 'mappingID', 'discardDemographic', 'destinationSystem'
const hiddenKeys: string[] = [
    "_id",
    "mappingID",
    "discardDemographic",
    "isCEdarEnabled",
    "sourceSystem",
    "alertType",
    "templateStatus",
    "destinationSystem",
    "numberOfApprovals",
    "locale",
    "breakOpen",
    "enableC360Demographics",
    "enableEbnc",
    "sendToRaven"
]

export default hiddenKeys

