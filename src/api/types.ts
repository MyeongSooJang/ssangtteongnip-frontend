// 백엔드 공통 응답 봉투. 성공은 { success: true, data }(본문 없는 응답은 data가 없으므로 ApiResponse<void>로 받는다), 실패는 { success: false, code, message }.
export interface ApiResponse<T> {
  success: boolean
  data: T
  code?: string
  message?: string
}

export type ApplicationStatus =
  | 'RESUME_SUBMITTED'
  | 'INTERVIEW'
  | 'ACCEPTED'
  | 'REJECTED'

export type ScheduleType = 'INTERVIEW' | 'DOCUMENT_SUBMISSION' | 'TASK' | 'OTHER'

export interface Company {
  id: number
  name: string
  industry: string
  website: string
  createdAt: string
}

// 회사 목록/상세 응답. 후기가 없으면 averageRating은 null이다.
export interface CompanyWithStats extends Company {
  reviewCount: number
  averageRating: number | null
}

// 회사 자동완성 후보. companyId가 null이면 목록에만 있는 회사라 선택할 때 등록해야 한다.
export interface CompanyCandidate {
  name: string
  listed: boolean
  companyId: number | null
}

export type InterviewAtmosphere = 'COMFORTABLE' | 'NORMAL' | 'TENSE'

export type ApplyRoute = 'ONLINE' | 'REFERRAL' | 'RECRUITER' | 'OTHER'

// 면접 상세. 모두 선택값이라 백엔드에서 null로 내려올 수 있다.
export interface InterviewDetail {
  difficulty?: number | null
  atmosphere?: InterviewAtmosphere | null
  route?: ApplyRoute | null
  questions?: string[]
}

// 회사별 공개 후기. 작성자 식별 정보는 내려오지 않는다(익명).
export interface CompanyReview extends InterviewDetail {
  id: number
  rating: number
  content: string
  position: string
  stage: ApplicationStatus
  createdAt: string
}

// 지원서를 제출한 구직 사이트. 백엔드 JobSite enum과 일치해야 한다.
export type JobSite =
  | 'JOBKOREA'
  | 'SARAMIN'
  | 'GROUPBY'
  | 'WANTED'
  | 'COMPANY_WEBSITE'
  | 'OTHER'

// 기업이 지원서를 열람했는지. 백엔드 ResumeView enum과 일치해야 한다.
export type ResumeView = 'VIEWED' | 'NOT_VIEWED'

export interface Application {
  id: number
  company: Company
  position: string
  status: ApplicationStatus
  appliedDate: string
  // 사이트 입력 기능 이전에 등록한 지원 건은 null로 내려온다.
  jobSite?: JobSite | null
  // 공고 마감일(yyyy-MM-dd). 모르면 null이고, null이면 자동 불합격 대상이 아니다.
  deadline?: string | null
  resumeView?: ResumeView
  // 마감일 + 1달이 지나 자동으로 불합격된 시각. 직접 불합격 처리했거나 불합격이 아니면 null이다.
  autoRejectedAt?: string | null
  createdAt: string
}

// 사이트별 서류 합격 통계 한 줄. 서류 합격은 면접 일정이 잡힌 지원 건을 뜻한다.
// 지원이 없는 사이트는 내려오지 않는다. 사이트가 비어 있는 지원 건은 jobSite가 null인 한 줄로 묶여 온다.
export interface JobSiteStat {
  jobSite: JobSite | null
  applicationCount: number
  documentPassedCount: number
  // 0.0 ~ 1.0
  documentPassRate: number
}

export interface InterviewQuestion {
  id: number
  question: string
  answer: string
  memo: string
}

export interface Interview {
  id: number
  round: number
  interviewDate: string
  location: string
  note: string
  score: number | null
  questions: InterviewQuestion[]
}

export interface Review extends InterviewDetail {
  id: number
  application: Application
  content: string | null
  rating: number | null
  createdAt: string
  updatedAt: string
}

export interface Schedule {
  id: number
  application: Application
  title: string
  scheduledAt: string
  type: ScheduleType
  address: string
  note: string
}

// 요청 타입
export interface CreateCompanyRequest {
  name: string
  industry?: string
  website?: string
}

export interface CreateApplicationRequest {
  companyId: number
  position: string
  appliedDate: string
  jobSite: JobSite
  deadline?: string
}

export interface UpdateStatusRequest {
  status: ApplicationStatus
}

export interface CreateInterviewRequest {
  round: number
  interviewDate: string
  location?: string
  note?: string
}

export interface CreateQuestionRequest {
  question: string
  answer?: string
  memo?: string
}

export interface WriteReviewRequest extends InterviewDetail {
  content: string
  rating: number
}

export interface CreateScheduleRequest {
  applicationId: number
  title: string
  scheduledAt: string
  type: ScheduleType
  address: string
  note?: string
}

// 인증 / 마이페이지
export interface SignupRequest {
  email: string
  name: string
  nickname: string
  password: string
}

export interface EmailVerificationRequest {
  email: string
}

export interface EmailVerificationConfirmRequest {
  email: string
  code: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  accessToken: string
}

// 백엔드 파일 종류(FileType)와 일치해야 한다. 대문자 그대로 보내야 한다.
export type FileType = 'RESUME' | 'PORTFOLIO' | 'CERTIFICATE' | 'ETC'

export interface UserFile {
  id: number
  type: FileType
  fileName: string
  sizeBytes: number
  // 타임존 없는 LocalDateTime 문자열 (예: 2026-11-13T10:00:00)
  createdAt: string
}

export interface FileDownloadUrl {
  url: string
  fileName: string
  expiresAt: string
}

export interface Profile {
  email: string
  name: string
  phone: string | null
  birthDate: string | null
  // 취업 준비 시작일(yyyy-MM-dd). 미입력이면 null
  jobSearchStartDate: string | null
  address: string | null
  githubUrl: string | null
  blogUrl: string | null
  portfolioUrl: string | null
  education: string | null
  career: string | null
  desiredJob: string | null
  introduction: string | null
  // 업로드 최신순. 서버가 준 순서 그대로 쓴다. 없으면 []
  files: UserFile[]
}

export type ProfileRequest = Omit<Profile, 'email' | 'files'>

// 학습 기록 (하루 여러 글, studyDate는 yyyy-MM-dd)
export interface StudyLog {
  id: number
  studyDate: string
  title: string
  content: string
  studyMinutes: number
}

export interface StudyLogCreateRequest {
  studyDate: string
  title: string
  content: string
  studyMinutes: number
}

export interface StudyLogUpdateRequest {
  title: string
  content: string
  studyMinutes: number
}

// 잔디용 날짜별 요약. 글이 있는 날만 내려온다.
export interface HeatmapDay {
  date: string
  count: number
  minutes: number
}

export interface StudyStats {
  currentStreak: number
  longestStreak: number
  monthWrittenDays: number
  todayMinutes: number
}

// 계획 (하루 여러 개, planDate는 yyyy-MM-dd). 결과물은 링크(URL) 또는 업로드 파일(FILE).
export type PlanCategory = 'APPLY' | 'SKILL' | 'OUTPUT' | 'LIFE'
export type PlanStatus = 'PLANNED' | 'DONE' | 'FAILED'
export type MissReason = 'TOO_BIG' | 'NOT_STARTED' | 'SCHEDULE' | 'CONDITION' | 'ETC'
export type EvidenceType = 'URL' | 'FILE'

export interface PlanEvidence {
  id: number
  type: EvidenceType
  url: string | null
  fileName: string | null
  sizeBytes: number | null
}

export interface Plan {
  id: number
  planDate: string
  content: string
  category: PlanCategory | null
  doneCriteria: string
  estimatedMinutes: number
  timeSlot: string | null
  place: string | null
  firstAction: string | null
  status: PlanStatus
  actualMinutes: number | null
  missReason: MissReason | null
  memo: string | null
  completedAt: string | null
  evidences: PlanEvidence[]
}

export interface PlanDetailInput {
  content: string
  category: PlanCategory | null
  doneCriteria: string
  estimatedMinutes: number
  timeSlot?: string
  place?: string
  firstAction?: string
}

export interface PlanCreateRequest extends PlanDetailInput {
  planDate: string
}

export interface PlanCompleteRequest {
  actualMinutes: number
  memo?: string
}

// 보내지 않은(undefined) 항목은 바꾸지 않는다. 메모만 빈 문자열로 보내 지울 수 있다.
export interface PlanReflectionRequest {
  actualMinutes?: number
  missReason?: MissReason
  memo?: string
}

export interface EvidenceDownload {
  url: string
  fileName: string
  expiresAt: string
}

// 닉네임을 아직 정하지 않은 기존 가입자는 nickname이 null이다.
export interface NicknameResponse {
  nickname: string | null
}

export interface PostImage {
  id: string
  // 서버가 주는 도메인 없는 경로(/api/post-images/{id}). 화면에는 toDisplayUrl로 API 주소를 붙여 쓴다.
  url: string
}

export interface PostSummary {
  id: number
  title: string
  nickname: string
  imageCount: number
  createdAt: string
}

// page는 0부터 시작한다.
export interface PostPage {
  posts: PostSummary[]
  page: number
  pageSize: number
  totalCount: number
}

export interface Post {
  id: number
  title: string
  content: string
  nickname: string
  // 보는 사람이 작성자면 true. 수정·삭제 버튼을 보일지 정한다.
  mine: boolean
  images: PostImage[]
  createdAt: string
  updatedAt: string
}

export interface PostCreateInput {
  title: string
  content: string
  images: File[]
}

export interface PostRewriteInput extends PostCreateInput {
  // 남길 기존 이미지. 빠진 이미지는 서버가 지운다.
  keepImageIds: string[]
}
