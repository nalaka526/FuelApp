import { Moment } from 'moment';
import * as _moment from 'moment';
const moment = _moment;

export class NewRecord {
  amount: number;
  price: number;
  oedometer: number;
  date: Moment = moment();
}
