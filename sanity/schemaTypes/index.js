import {nbaIct} from './nbaIct'
import {nbaIctData} from './nbaIctData'
import {academicYear} from './academicYear'
import {nptelData} from './nptelData'
import {ictTools} from './ictTools'
import {innovativeTeaching} from './innovativeTeaching'
import {facultyCertification} from './facultyCertification'
import {facultyCertData} from './facultyCertData'
import {caseStudy} from './caseStudy'
import {caseStudyData} from './caseStudyData'
import {miniProject} from './miniProject'
import {miniProjectData} from './miniProjectData'
import {nonFormal} from './nonFormal'
import {nonFormalData} from './nonFormalData'
import {journal} from './journal'
import {journalData} from './journalData'
import {scopus} from './scopus'
import {scopusData} from './scopusData'
import {freelancingInternship} from './freelancingInternship'
import {freelancingInternshipData} from './freelancingInternshipData'
import {placementInternship} from './placementInternship'
import {placementInternshipData} from './placementInternshipData'
import {seminar} from './seminar'
import {seminarData} from './seminarData'
import {industrialInvolvement} from './industrialInvolvement'
import {industrialInvolvementData} from './industrialInvolvementData'
import {guestLecture} from './guestLecture'
import {guestLectureData} from './guestLectureData'
import {coCurricularSdg} from './coCurricularSdg'
import {coCurricularSdgData} from './coCurricularSdgData'
// ── CEP — Strategies Employed to Solve Complex Engineering Problems ────────────
import {cepUpload_pbl} from './cepUpload_pbl'
import {cepData_pbl} from './cepData_pbl'
import {cepUpload_projbl} from './cepUpload_projbl'
import {cepData_projbl} from './cepData_projbl'
import {cepUpload_mini} from './cepUpload_mini'
import {cepData_mini} from './cepData_mini'
import {cepUpload_capstone} from './cepUpload_capstone'
import {cepData_capstone} from './cepData_capstone'
import {cepUpload_idp} from './cepUpload_idp'
import {cepData_idp} from './cepData_idp'
import {cepUpload_hackathon} from './cepUpload_hackathon'
import {cepData_hackathon} from './cepData_hackathon'
import {cepUpload_abl} from './cepUpload_abl'
import {cepData_abl} from './cepData_abl'
// ── NBA 6.2 — Journal / Conference / Book ─────────────────────────────────────
import {nba62Journal} from './nba62Journal'
import {nba62JournalData} from './nba62JournalData'
import {nba62Conference} from './nba62Conference'
import {nba62ConferenceData} from './nba62ConferenceData'
import {nba62Book} from './nba62Book'
import {nba62BookData} from './nba62BookData'
// ── NBA 6.2.3 — Faculty Developmental Activities ──────────────────────────────
import {nba623FacultyDev} from './nba623FacultyDev'
import {nba623FacultyDevData} from './nba623FacultyDevData'
import {nba623Patent} from './nba623Patent'
import {nba623PatentData} from './nba623PatentData'
// ── Infosys Springboard Certification ─────────────────────────────────────────
import {infospringYear} from './infospringYear'
import {infospringCoord} from './infospringCoord'
import {infospringData} from './infospringData'

export const schemaTypes = [
  nbaIct,
  nbaIctData,
  academicYear,
  nptelData,
  ictTools,
  innovativeTeaching,
  facultyCertification,
  facultyCertData,
  caseStudy,
  caseStudyData,
  miniProject,
  miniProjectData,
  nonFormal,
  nonFormalData,
  journal,
  journalData,
  scopus,
  scopusData,
  freelancingInternship,
  freelancingInternshipData,
  placementInternship,
  placementInternshipData,
  seminar,
  seminarData,
  industrialInvolvement,
  industrialInvolvementData,
  guestLecture,
  guestLectureData,
  coCurricularSdg,
  coCurricularSdgData,
  // CEP strategies
  cepUpload_pbl,   cepData_pbl,
  cepUpload_projbl, cepData_projbl,
  cepUpload_mini,  cepData_mini,
  cepUpload_capstone, cepData_capstone,
  cepUpload_idp,   cepData_idp,
  cepUpload_hackathon, cepData_hackathon,
  cepUpload_abl,   cepData_abl,
  // NBA 6.2
  nba62Journal,    nba62JournalData,
  nba62Conference, nba62ConferenceData,
  nba62Book,       nba62BookData,
  // NBA 6.2.3
  nba623FacultyDev, nba623FacultyDevData,
  nba623Patent,     nba623PatentData,
  // Infosys Springboard
  infospringYear,
  infospringCoord,
  infospringData,
]
