import { AuthRepositoryImpl } from "../data/repository/AuthRepositoryImpl";
import { CourseRepositoryImpl } from "../data/repository/CourseRepositoryImpl";
import { GradeRepositoryImpl } from "../data/repository/GradeRepositoryImpl";
import { ConsoleCrashReporter } from "../data/service/ConsoleCrashReporter";
import { FirebaseAnalyticsReporter } from "../data/service/FirebaseAnalyticsReporter";
import { SignInWithGoogleUseCase } from "../domain/usecase/SignInWithGoogleUseCase";
import { SignInWithEmailPasswordUseCase } from "../domain/usecase/SignInWithEmailPasswordUseCase";
import { ObserveSessionUseCase } from "../domain/usecase/ObserveSessionUseCase";
import { SyllabusRepositoryImpl } from "../data/repository/SyllabusRepositoryImpl";
import { GetSyllabusUrlUseCase } from "../domain/usecase/GetSyllabusUrlUseCase";
import { SignOutUseCase } from "../domain/usecase/SignOutUseCase";
import { GetCourseUseCase } from "../domain/usecase/GetCourseUseCase";
import { GetCourseStudentsUseCase } from "../domain/usecase/GetCourseStudentsUseCase";
import { GetGradeItemsUseCase } from "../domain/usecase/GetGradeItemsUseCase";
import { AddGradeItemUseCase } from "../domain/usecase/AddGradeItemUseCase";
import { GetMyGradesUseCase } from "../domain/usecase/GetMyGradesUseCase";
import { GetStudentGradesUseCase } from "../domain/usecase/GetStudentGradesUseCase";
import { SetStudentGradeUseCase } from "../domain/usecase/SetStudentGradeUseCase";
import { DeleteStudentGradeUseCase } from "../domain/usecase/DeleteStudentGradeUseCase";
import { UpdateGradeItemUseCase } from "../domain/usecase/UpdateGradeItemUseCase";
import { DeleteGradeItemUseCase } from "../domain/usecase/DeleteGradeItemUseCase";
import { GetCourseGradesOverviewUseCase } from "../domain/usecase/GetCourseGradesOverviewUseCase";
import { RedeemRegistrationCodeUseCase } from "../domain/usecase/RedeemRegistrationCodeUseCase";
import { RegenerateAccessCodeUseCase } from "../domain/usecase/RegenerateAccessCodeUseCase";
import { ProfileRepositoryImpl } from "../data/repository/ProfileRepositoryImpl";
import { UploadProfilePhotoUseCase } from "../domain/usecase/UploadProfilePhotoUseCase";
import { TeamRepositoryImpl } from "../data/repository/TeamRepositoryImpl";
import { GetCourseTeamsUseCase } from "../domain/usecase/GetCourseTeamsUseCase";
import { CreateTeamUseCase } from "../domain/usecase/CreateTeamUseCase";
import { RenameTeamUseCase } from "../domain/usecase/RenameTeamUseCase";
import { DeleteTeamUseCase } from "../domain/usecase/DeleteTeamUseCase";
import { GetTeamByIdUseCase } from "../domain/usecase/GetTeamByIdUseCase";
import { GetMyTeamUseCase } from "../domain/usecase/GetMyTeamUseCase";
import { GetTeamTasksUseCase } from "../domain/usecase/GetTeamTasksUseCase";
import { CreateTaskUseCase } from "../domain/usecase/CreateTaskUseCase";
import { MoveTaskUseCase } from "../domain/usecase/MoveTaskUseCase";
import { DeleteTaskUseCase } from "../domain/usecase/DeleteTaskUseCase";
import { AddStudentToTeamUseCase } from "../domain/usecase/AddStudentToTeamUseCase";
import { RemoveStudentFromTeamUseCase } from "../domain/usecase/RemoveStudentFromTeamUseCase";
import { AttendanceRepositoryImpl } from "../data/repository/AttendanceRepositoryImpl";
import { StartAttendanceSessionUseCase } from "../domain/usecase/StartAttendanceSessionUseCase";
import { CloseAttendanceSessionUseCase } from "../domain/usecase/CloseAttendanceSessionUseCase";
import { ObserveActiveAttendanceSessionUseCase } from "../domain/usecase/ObserveActiveAttendanceSessionUseCase";
import { ObserveAttendanceRegistrationsUseCase } from "../domain/usecase/ObserveAttendanceRegistrationsUseCase";
import { SubmitAttendanceUseCase } from "../domain/usecase/SubmitAttendanceUseCase";
import { HasSubmittedAttendanceUseCase } from "../domain/usecase/HasSubmittedAttendanceUseCase";
import { PollRepositoryImpl } from "../data/repository/PollRepositoryImpl";
import { StartPollUseCase } from "../domain/usecase/StartPollUseCase";
import { ClosePollUseCase } from "../domain/usecase/ClosePollUseCase";
import { ObserveLatestPollUseCase } from "../domain/usecase/ObserveLatestPollUseCase";
import { ObservePollVotesUseCase } from "../domain/usecase/ObservePollVotesUseCase";
import { SubmitVoteUseCase } from "../domain/usecase/SubmitVoteUseCase";
import { ObserveMyVoteUseCase } from "../domain/usecase/ObserveMyVoteUseCase";
import { QuizRepositoryImpl } from "../data/repository/QuizRepositoryImpl";
import { GetQuestionBankUseCase } from "../domain/usecase/GetQuestionBankUseCase";
import { CreateQuizQuestionUseCase } from "../domain/usecase/CreateQuizQuestionUseCase";
import { UpdateQuizQuestionUseCase } from "../domain/usecase/UpdateQuizQuestionUseCase";
import { DeleteQuizQuestionUseCase } from "../domain/usecase/DeleteQuizQuestionUseCase";
import { LaunchQuizQuestionUseCase } from "../domain/usecase/LaunchQuizQuestionUseCase";
import { CloseQuizSessionUseCase } from "../domain/usecase/CloseQuizSessionUseCase";
import { ObserveLatestQuizSessionUseCase } from "../domain/usecase/ObserveLatestQuizSessionUseCase";
import { ObserveQuizSessionAnswersUseCase } from "../domain/usecase/ObserveQuizSessionAnswersUseCase";
import { SubmitQuizAnswerUseCase } from "../domain/usecase/SubmitQuizAnswerUseCase";
import { ObserveMyQuizAnswerUseCase } from "../domain/usecase/ObserveMyQuizAnswerUseCase";
import { ObserveCourseQuizStandingUseCase } from "../domain/usecase/ObserveCourseQuizStandingUseCase";
import { ObserveMyQuizStandingUseCase } from "../domain/usecase/ObserveMyQuizStandingUseCase";
import { ResetQuizStandingUseCase } from "../domain/usecase/ResetQuizStandingUseCase";
import { PostRepositoryImpl } from "../data/repository/PostRepositoryImpl";
import { CreatePostUseCase } from "../domain/usecase/CreatePostUseCase";
import { UpdatePostUseCase } from "../domain/usecase/UpdatePostUseCase";
import { DeletePostUseCase } from "../domain/usecase/DeletePostUseCase";
import { ObservePostsUseCase } from "../domain/usecase/ObservePostsUseCase";
import { ObservePostReactionsUseCase } from "../domain/usecase/ObservePostReactionsUseCase";
import { SetMyReactionUseCase } from "../domain/usecase/SetMyReactionUseCase";
import { RemoveMyReactionUseCase } from "../domain/usecase/RemoveMyReactionUseCase";
import { ObserveMyReactionUseCase } from "../domain/usecase/ObserveMyReactionUseCase";
import { RemoveProfilePhotoUseCase } from "../domain/usecase/RemoveProfilePhotoUseCase";
import { ObserveProfilePhotoUseCase } from "../domain/usecase/ObserveProfilePhotoUseCase";
import { NotificationRepositoryImpl } from "../data/repository/NotificationRepositoryImpl";
import { ActivityFeedRepositoryImpl } from "../data/repository/ActivityFeedRepositoryImpl";
import { ObserveCourseActivityUseCase } from "../domain/usecase/ObserveCourseActivityUseCase";
import { SubscribeToCourseNotificationsUseCase } from "../domain/usecase/SubscribeToCourseNotificationsUseCase";
import { UnsubscribeFromCourseNotificationsUseCase } from "../domain/usecase/UnsubscribeFromCourseNotificationsUseCase";



const crashReporter = new ConsoleCrashReporter();
const analyticsReporter = new FirebaseAnalyticsReporter();
const authRepository = new AuthRepositoryImpl(crashReporter);
const courseRepository = new CourseRepositoryImpl(crashReporter);
const syllabusRepository = new SyllabusRepositoryImpl(crashReporter);
const gradeRepository = new GradeRepositoryImpl(crashReporter);
const profileRepository = new ProfileRepositoryImpl(crashReporter);
const teamRepository = new TeamRepositoryImpl(crashReporter);
const attendanceRepository = new AttendanceRepositoryImpl(crashReporter);
const pollRepository = new PollRepositoryImpl(crashReporter);
const quizRepository = new QuizRepositoryImpl(crashReporter);
const postRepository = new PostRepositoryImpl(crashReporter);
const notificationRepository = new NotificationRepositoryImpl(crashReporter);
const activityFeedRepository = new ActivityFeedRepositoryImpl(crashReporter);

export const container = {
  crashReporter,
  analyticsReporter,
  authRepository,
  courseRepository,
  signInWithGoogleUseCase: new SignInWithGoogleUseCase(authRepository),
  signInWithEmailPasswordUseCase: new SignInWithEmailPasswordUseCase(authRepository),
  observeSessionUseCase: new ObserveSessionUseCase(authRepository),
  signOutUseCase: new SignOutUseCase(authRepository),
  getCourseUseCase: new GetCourseUseCase(courseRepository),
  getCourseStudentsUseCase: new GetCourseStudentsUseCase(courseRepository),
  syllabusRepository,
  getSyllabusUrlUseCase: new GetSyllabusUrlUseCase(syllabusRepository),
  gradeRepository,
  getGradeItemsUseCase: new GetGradeItemsUseCase(gradeRepository),
  addGradeItemUseCase: new AddGradeItemUseCase(gradeRepository),
  getMyGradesUseCase: new GetMyGradesUseCase(gradeRepository),
  getStudentGradesUseCase: new GetStudentGradesUseCase(gradeRepository),
  setStudentGradeUseCase: new SetStudentGradeUseCase(gradeRepository),
  deleteStudentGradeUseCase: new DeleteStudentGradeUseCase(gradeRepository),
  getCourseGradesOverviewUseCase: new GetCourseGradesOverviewUseCase(gradeRepository),
  updateGradeItemUseCase: new UpdateGradeItemUseCase(gradeRepository),
  deleteGradeItemUseCase: new DeleteGradeItemUseCase(gradeRepository),
  redeemRegistrationCodeUseCase: new RedeemRegistrationCodeUseCase(courseRepository),
  regenerateAccessCodeUseCase: new RegenerateAccessCodeUseCase(courseRepository),
  profileRepository,
  uploadProfilePhotoUseCase: new UploadProfilePhotoUseCase(profileRepository),
  removeProfilePhotoUseCase: new RemoveProfilePhotoUseCase(profileRepository),
  observeProfilePhotoUseCase: new ObserveProfilePhotoUseCase(profileRepository),
  teamRepository,
  getCourseTeamsUseCase: new GetCourseTeamsUseCase(teamRepository),
  createTeamUseCase: new CreateTeamUseCase(teamRepository),
  renameTeamUseCase: new RenameTeamUseCase(teamRepository),
  deleteTeamUseCase: new DeleteTeamUseCase(teamRepository),
  getTeamByIdUseCase: new GetTeamByIdUseCase(teamRepository),
  getMyTeamUseCase: new GetMyTeamUseCase(teamRepository),
  getTeamTasksUseCase: new GetTeamTasksUseCase(teamRepository),
  createTaskUseCase: new CreateTaskUseCase(teamRepository),
  moveTaskUseCase: new MoveTaskUseCase(teamRepository),
  deleteTaskUseCase: new DeleteTaskUseCase(teamRepository),
  addStudentToTeamUseCase: new AddStudentToTeamUseCase(teamRepository),
  removeStudentFromTeamUseCase: new RemoveStudentFromTeamUseCase(teamRepository),
  attendanceRepository,
  startAttendanceSessionUseCase: new StartAttendanceSessionUseCase(attendanceRepository),
  closeAttendanceSessionUseCase: new CloseAttendanceSessionUseCase(attendanceRepository),
  observeActiveAttendanceSessionUseCase: new ObserveActiveAttendanceSessionUseCase(attendanceRepository),
  observeAttendanceRegistrationsUseCase: new ObserveAttendanceRegistrationsUseCase(attendanceRepository),
  submitAttendanceUseCase: new SubmitAttendanceUseCase(attendanceRepository),
  hasSubmittedAttendanceUseCase: new HasSubmittedAttendanceUseCase(attendanceRepository),
  pollRepository,
  startPollUseCase: new StartPollUseCase(pollRepository),
  closePollUseCase: new ClosePollUseCase(pollRepository),
  observeLatestPollUseCase: new ObserveLatestPollUseCase(pollRepository),
  observePollVotesUseCase: new ObservePollVotesUseCase(pollRepository),
  submitVoteUseCase: new SubmitVoteUseCase(pollRepository),
  observeMyVoteUseCase: new ObserveMyVoteUseCase(pollRepository),
  quizRepository,
  getQuestionBankUseCase: new GetQuestionBankUseCase(quizRepository),
  createQuizQuestionUseCase: new CreateQuizQuestionUseCase(quizRepository),
  updateQuizQuestionUseCase: new UpdateQuizQuestionUseCase(quizRepository),
  deleteQuizQuestionUseCase: new DeleteQuizQuestionUseCase(quizRepository),
  launchQuizQuestionUseCase: new LaunchQuizQuestionUseCase(quizRepository),
  closeQuizSessionUseCase: new CloseQuizSessionUseCase(quizRepository),
  observeLatestQuizSessionUseCase: new ObserveLatestQuizSessionUseCase(quizRepository),
  observeQuizSessionAnswersUseCase: new ObserveQuizSessionAnswersUseCase(quizRepository),
  submitQuizAnswerUseCase: new SubmitQuizAnswerUseCase(quizRepository),
  observeMyQuizAnswerUseCase: new ObserveMyQuizAnswerUseCase(quizRepository),
  observeCourseQuizStandingUseCase: new ObserveCourseQuizStandingUseCase(quizRepository),
  observeMyQuizStandingUseCase: new ObserveMyQuizStandingUseCase(quizRepository),
  resetQuizStandingUseCase: new ResetQuizStandingUseCase(quizRepository),
  postRepository,
  createPostUseCase: new CreatePostUseCase(postRepository),
  updatePostUseCase: new UpdatePostUseCase(postRepository),
  deletePostUseCase: new DeletePostUseCase(postRepository),
  observePostsUseCase: new ObservePostsUseCase(postRepository),
  observePostReactionsUseCase: new ObservePostReactionsUseCase(postRepository),
  setMyReactionUseCase: new SetMyReactionUseCase(postRepository),
  removeMyReactionUseCase: new RemoveMyReactionUseCase(postRepository),
  observeMyReactionUseCase: new ObserveMyReactionUseCase(postRepository),
  notificationRepository,
  subscribeToCourseNotificationsUseCase: new SubscribeToCourseNotificationsUseCase(notificationRepository),
  unsubscribeFromCourseNotificationsUseCase: new UnsubscribeFromCourseNotificationsUseCase(notificationRepository),
  activityFeedRepository,
  observeCourseActivityUseCase: new ObserveCourseActivityUseCase(activityFeedRepository),
};