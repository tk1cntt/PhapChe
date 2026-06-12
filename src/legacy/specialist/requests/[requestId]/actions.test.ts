import type { SpecialistRequestActionResult } from './actions';
import { closeDeliveredAction, markDeliveredAction } from './actions';

type DeliveryAction = (formData: FormData) => Promise<SpecialistRequestActionResult>;

const deliverResultAction: DeliveryAction = markDeliveredAction;
const finishResultAction: DeliveryAction = closeDeliveredAction;

void deliverResultAction;
void finishResultAction;
