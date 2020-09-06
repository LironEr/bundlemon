import github from './github';
import codefresh from './codefresh';
import travis from './travis';
import circleCI from './circleCI';

const providers = [github, codefresh, travis, circleCI];

export default providers;
