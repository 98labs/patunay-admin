import { useDispatch } from 'react-redux';
import { showNotification } from '../components/NotificationMessage/slice';

export const useNotification = () => {
  const dispatch = useDispatch();

  const showSuccess = (message: string, title?: string) => {
    dispatch(showNotification({
      title: title || 'Success',
      message,
      status: 'success'
    }));
  };

  const showError = (message: string, title?: string) => {
    dispatch(showNotification({
      title: title || 'Error',
      message,
      status: 'error'
    }));
  };

  const showInfo = (message: string, title?: string) => {
    dispatch(showNotification({
      title: title || 'Info',
      message,
      status: 'info'
    }));
  };

  return {
    showSuccess,
    showError,
    showInfo
  };
};