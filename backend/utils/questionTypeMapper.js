// maps backend question types to database enum values
function mapQuestionType(backendType) {
  switch (backendType) {
    case 'MCQ_single_answer':
      return { question_type: 'mcq', mcq_type: 'single' };
    case 'MCQ_multiple_answers':
      return { question_type: 'mcq', mcq_type: 'multiple' };
    case 'True/False':
    case 'true_false':
      return { question_type: 'true_false', mcq_type: null };
    case 'Short Answer':
    case 'short_answer':
      return { question_type: 'short_answer', mcq_type: null };
    case 'Fill in the blanks':
    case 'fill_in_the_blanks':
      return { question_type: 'fill_in_the_blanks', mcq_type: null };
    case 'Video':
    case 'video':
      return { question_type: 'video', mcq_type: null };
    case 'Matching':
    case 'matching':
      return { question_type: 'matching', mcq_type: null };
    case 'Open Ended':
    case 'open_ended':
      return { question_type: 'open_ended', mcq_type: null };
    case 'Peer Graded':
    case 'peer_graded':
      return { question_type: 'peer_graded', mcq_type: null };
    default:
      return { question_type: 'mcq', mcq_type: 'single' }; // default fallback
  }
}

module.exports = mapQuestionType;