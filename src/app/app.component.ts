import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Record } from 'src/app/record.model';
import { NewRecord } from './newRecord.model';


export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class AppComponent {

  title = 'FuelApp';
  records: Observable<Record[]>;
  recordsCollectionRef: AngularFirestoreCollection<Record>;
  model: NewRecord = new NewRecord;

  constructor(private db: AngularFirestore) {
    this.recordsCollectionRef = db.collection<Record>('records', ref => ref.orderBy('amount'));
    this.records = this.recordsCollectionRef.valueChanges();
  }

  createRecord() {
    this.recordsCollectionRef.add({ amount: Number(this.model.amount),
                  price: Number(this.model.price),
                  date: this.model.date.toDate(),
                  recordDateTime: new Date });
  }
}
