/**
 *  GLOBAL STRINGS
 */
export const MSG_UNEXPECTED_ERROR = 'Unexpected Error. if problem persists please contact Support';
export const MSG_UNEXPECTED_ERROR_REFRESH_PAGE = MSG_UNEXPECTED_ERROR + ' Try to Refresh the Page';

/**
 *  SHARED SESSION TYPES COMPONENT
 */
export const MSG_STC_ERROR_CREATING_SESSION_TYPE = 'Error creating session type. Please try again later';
export const MSG_STC_ERROR_SESSION_TYPE_TITLE_CANNOT_BE_EMPTY = 'Session type title cannot be empty';


/**
 *  PARENT PACKAGES COMPONENT
 */
export const MSG_PPC_EMPTY_TITLE_NOT_ALLOWED = 'Empty parent package title is not allowed.';
export const MSG_DELETE_PARENT_PACKAGE = 'Deleting a parent package will result in some of the packages to become orphans.\n'
  + ' Orphan packages will not be visible to the mobile applications.';
export const MSG_FAILED_TO_DELETE_PACKAGE = 'Deleting parent package failed. Please try again. If problem persists, '
  + 'please contact support.';

/**
 *  PACKAGES COMPONENT
 */
export const MSG_FAILED_TO_UPDATE_PARENT_PACKAGE = 'Failed to update parent package, please set this package to '
  + 'NOT visible and immediately contact support!';
export const MSG_FAILED_TO_REMOVE_CHILD_PACKAGE_OF_OLD_PARENT = 'Failed to remove child package of the previous parent package, '
  + 'please contact support immediately and provide as much detail as possible to resolve the issue';
export const MSG_PC_FAILED_TO_UPDATE_PACKAGE = 'Failed to update package. Please try again. If problem persists contact support!';


/**
 * CLIENTS COMPONENT
 */

export const MSG_CLIENT_NAME_REQUIRED = 'Client name is required and must be greater than 4 characters';
export const MSG_PHONE_NUMBER_REQUIRED = 'Phone number is required and must contain only numbers';
export const MSG_EMAIL_REQUIRED = 'Email is a required field';
export const MSG_EMAIL_INVALID_FORMAT = 'Email has an invalid format.';


/**
 * CLIENT COMPONENT
 */

export const MSG_CC_CONFIRM_ADD_CLIENT_PACKAGE = (packageTitle: string, clientName: string) => {
  return `You are about to add package: "${packageTitle}" to ${clientName}'s packages. Proceed?`;
};

export const MSG_CC_PACKAGE_PAYMENT_NO_ZERO_ALLOWED = 'Payment cannot be less or equal to 0.';
export const MSG_CC_CONFIRM_CLIENT_PACKAGE_PAYMENT_REMOVAL = (payment: number) => {
  return `Remove ${payment} from payments list. Proceed?`;
};
export const MSG_CC_ONLY_NUMBERS_ALLOWED = 'Please enter a valid number.';
export const MSG_CC_EST_MAX_USAGES_ERROR = 'Max usages cannot be a negative number';


/**
 * NEW APPOINTMENT COMPONENT
 */

export const MSG_NAC_PLEASE_SELECT_A_DATE = 'Adding sessions without selecting a date first is not permitted.';
export const MSG_NAC_ENTER_VALID_SESSION_TYPE = 'Please enter a valid Session-Type.';
export const MSG_NAC_START_END_TIME_REQUIRED = 'Start time and end time are required.';
export const MSG_NAC_END_DATE_LESS_THAN_START_DATE = 'End time cannot be sooner than the start time.';
export const MSG_NAC_SPOTS_CANNOT_BE_0_OR_LESS = 'Spots must be greater than zero.';
export const MSG_NAC_REPEAT_NO_GREATER_THAN_0 = 'Repeat number must be greater than 0';
export const MSG_NAC_REPEAT_NO_LIMIT = (limit: number) => {
  return `Repeat number cannot be greater than ${limit}.`;
}
