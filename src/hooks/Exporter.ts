import {saveAs} from "file-saver"
import * as Minizip from "minizip-asm.js"
import * as PapaParse from "papaparse"
import {useCallback} from "react"
import {v4 as uuid} from "uuid"
import {formatExportDate} from "../helpers/DateFormatter"
import {Assessment} from "../types/Assessment"
import {Client} from "../types/Client"
import {CSVImport, CSVImportSchema} from "../types/CSVImport"
import {useQuestionTexts} from "./QuestionTexts"

export const useAssessmentExporter = () => {
  const questionTexts = useQuestionTexts()
  const data = useCallback(
    (assessments: Assessment[], allClients: Client[]): string =>
      [
        [
          "Client Name",
          "Date Start",
          "Date End",
          ...questionTexts
            .map((text) => [`${text.export} Rank`, `${text.export} Additional Help`, `${text.export} Discussed`])
            .flat(),
          ...questionTexts.map((text) => `${text.export} Action Items`),
        ].join(","),
        ["", "", "", ...questionTexts.map((text) => [text.long, "", ""]).flat()].join(","),
        ...assessments.map((assessment) => {
          const client = allClients.find((client) => client.id === assessment.meta.clientId)
          return [
            clientName(client),
            `"${formatExportDate(assessment.meta.date)}"`,
            `"${formatExportDate(assessment.meta.lastUpdated)}"`,
            ...assessment.questions
              .map((question) => [
                question.value.selectedOption?.toString() ?? "",
                booleanOrUndefined(question.value.furtherHelp, "2", "1", ""),
                question.state.selected ? "1" : "0",
              ])
              .flat(),
            ...assessment.questions.map((question) => question.value.actionItems.join(";")),
          ].join(",")
        }),
      ].join("\n"),
    [questionTexts],
  )
  return {
    data,
    import: useCallback(
      async (file: File, password?: string): Promise<{clients: Client[]; assessments: Assessment[]}> => {
        if (!password) {
          return {clients: [], assessments: []}
        }
        try {
          const buffer = Buffer.from(await file.arrayBuffer())
          const miniZip = new Minizip(buffer)
          const zippedFiles = miniZip.list()
          if (zippedFiles.length > 0) {
            const {filepath} = zippedFiles[0]
            const fileData = miniZip.extract(filepath, {password})
            const string = new TextDecoder().decode(fileData)
            const csvData = PapaParse.parse(string, {header: true, skipEmptyLines: true})
            const dataExcludingFirstLine = csvData.data?.filter((_, index) => index > 0)
            const parseAttempt = CSVImportSchema.safeParse(dataExcludingFirstLine)
            if (parseAttempt.success) {
              return importData(parseAttempt.data)
            }
          }
          return {clients: [], assessments: []}
        } catch (error) {
          return {clients: [], assessments: []}
        }
      },
      [],
    ),
    export: useCallback(
      async (assessments: Assessment[], allClients: Client[], password?: string) => {
        if (!password) {
          return
        }
        const blob = new Blob([data(assessments, allClients)], {type: "text/csv;charset=utf-8"})
        const miniZip = new Minizip()
        miniZip.append("DIALOG+ Export.csv", await blob.arrayBuffer(), {password})
        saveAs(new Blob([miniZip.zip()]), "DIALOG+ Export.zip")
      },
      [data],
    ),
  }
}

const importData = (csvData: CSVImport): {clients: Client[]; assessments: Assessment[]} => {
  const clients = csvData.map((row) => ({id: uuid(), ...row["Client Name"]}))
  const assessments = csvData.map((row, index) => {
    const client = clients[index]
    return {
      id: uuid(),
      meta: {
        date: row["Date Start"] ?? new Date(),
        lastUpdated: row["Date End"] ?? new Date(),
        clientId: client.id,
      },
      questions: [
        {
          state: {
            collapsed: true,
            selected: row["Mental Health Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Mental Health Rank"],
            furtherHelp: row["Mental Health Additional Help"],
            actionItems: row["Mental Health Action Items"],
          },
        },
        {
          state: {
            collapsed: true,
            selected: row["Physical Health Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Physical Health Rank"],
            furtherHelp: row["Physical Health Additional Help"],
            actionItems: row["Physical Health Action Items"],
          },
        },
        {
          state: {
            collapsed: true,
            selected: row["Job Situation Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Job Situation Rank"],
            furtherHelp: row["Job Situation Additional Help"],
            actionItems: row["Job Situation Action Items"],
          },
        },
        {
          state: {
            collapsed: true,
            selected: row["Accommodation Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Accommodation Rank"],
            furtherHelp: row["Accommodation Additional Help"],
            actionItems: row["Accommodation Action Items"],
          },
        },
        {
          state: {
            collapsed: true,
            // note the special case to fix typo in native app export
            selected: row["Leisure Activities Discussed"] ?? row["Leisure Activitie Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Leisure Activities Rank"],
            furtherHelp: row["Leisure Activities Additional Help"],
            actionItems: row["Leisure Activities Action Items"],
          },
        },
        {
          state: {
            collapsed: true,
            selected: row["Partner / Family Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Partner / Family Rank"],
            furtherHelp: row["Partner / Family Additional Help"],
            actionItems: row["Partner / Family Action Items"],
          },
        },
        {
          state: {
            collapsed: true,
            selected: row["Friendships Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Friendships Rank"],
            furtherHelp: row["Friendships Additional Help"],
            actionItems: row["Friendships Action Items"],
          },
        },
        {
          state: {
            collapsed: true,
            selected: row["Personal Safety Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Personal Safety Rank"],
            furtherHelp: row["Personal Safety Additional Help"],
            actionItems: row["Personal Safety Action Items"],
          },
        },
        {
          state: {
            collapsed: true,
            selected: row["Medication Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Medication Rank"],
            furtherHelp: row["Medication Additional Help"],
            actionItems: row["Medication Action Items"],
          },
        },
        {
          state: {
            collapsed: true,
            selected: row["Practical Help Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Practical Help Rank"],
            furtherHelp: row["Practical Help Additional Help"],
            actionItems: row["Practical Help Action Items"],
          },
        },
        {
          state: {
            collapsed: true,
            selected: row["Meetings Discussed"] ?? false,
          },
          value: {
            selectedOption: row["Meetings Rank"],
            furtherHelp: row["Meetings Additional Help"],
            actionItems: row["Meetings Action Items"],
          },
        },
      ],
    }
  })
  return {clients, assessments}
}

const booleanOrUndefined = (
  value: boolean | undefined,
  trueOption: string,
  falseOption: string,
  undefinedOption: string,
): string => {
  switch (value) {
    case undefined:
      return undefinedOption
    case true:
      return trueOption
    case false:
      return falseOption
  }
}

const clientName = (client?: Client): string => {
  if (!client) {
    return ""
  }
  if (client.last) {
    if (client.first || client.middle) {
      return `"${client.last}, ${client.first ? " " + client.first : ""}${client.middle ? " " + client.middle : ""}"`
    } else {
      return client.last
    }
  }
  return [client.first, client.middle].filter((component) => component?.length).join(" ")
}
