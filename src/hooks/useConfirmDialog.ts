import { toast } from 'sonner';
import { useConfirmDialogContext } from '@/components/ConfirmDialogProvider';

export const useConfirmDialog = () => {
  const { confirm: confirmContext } = useConfirmDialogContext();

  const confirm = async (message: string, title?: string): Promise<boolean> => {
    return confirmContext(message, title);
  };

  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 3000,
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      duration: 4000,
    });
  };

  return { confirm, showSuccess, showError };
};

