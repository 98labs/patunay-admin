import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeNotificationMessage } from './slice';
import { selectNotif } from './selector'

const NotificationMessage = () => {

    const { message, status } = useSelector(selectNotif);
    const dispatch = useDispatch();

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => dispatch(removeNotificationMessage()), 3000);
      return () => clearTimeout(timeout);
    }
  }, [message, dispatch]);

    const alertTypeClass = {
        success: 'alert-success',
        error: 'alert-error',
        info: 'alert-info',
    }[status || 'info'];
  
    return (
        <div className={`${status ? '': 'hidden '}toast toast-top toast-end`}>
          <div className={`alert ${alertTypeClass}`}>
            <span>{message}</span>
          </div>
        </div>
    );
};
  
  export default NotificationMessage;
  