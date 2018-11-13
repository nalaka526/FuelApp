import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Record } from 'src/app/record.model';
import { NewRecord } from './newRecord.model';
import { map } from 'rxjs/operators';

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
  displayedColumns: string[] = ['date', 'oedometer', 'price',  'amount', 'star'];

  constructor(private db: AngularFirestore) {
    this.recordsCollectionRef = db.collection<Record>('records', ref => ref.orderBy('date'));
    this.records = this.recordsCollectionRef.snapshotChanges().pipe(
      map(changes => { return changes.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...data };
      });
    }
  ));
  }

  createRecord() {

    if (typeof this.model.amount != 'number') {
      return;
    }

    if (typeof this.model.price != 'number') {
      return;
    }

    if (typeof this.model.oedometer != 'number') {
      return;
    }

    if (this.model.date == null) {
      return;
    }

    this.recordsCollectionRef.add({ amount: Number(this.model.amount),
                  price: Number(this.model.price),
                  oedometer: Number(this.model.oedometer),
                  date: this.model.date.toDate(),
                  recordDateTime: new Date });
  }

  deleteRow(row) {
    this.recordsCollectionRef.doc(`${row.id}`).delete()
  }
}
