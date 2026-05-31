import type { SpecialistRequestActionResult } from './actions';
import { closeDeliveredAction, markDeliveredAction } from './actions';

type DeliveryAction = (formData: FormData) => Promise<SpecialistRequestActionResult>;

const deliveryAction: DeliveryAction = markDeliveredAction;
const closeAction: DeliveryAction = closeDeliveredAction;

void deliveryAction;
void closeAction;
