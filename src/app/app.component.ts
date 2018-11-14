import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Record } from 'src/app/record.model';
import { NewRecord } from './newRecord.model';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import { MatSnackBar } from '@angular/material';

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL'
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [{ provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }, { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }]
})
export class AppComponent implements OnInit {
  userId: string;
  userName: string;

  // records: Observable<Record[]>;
  records: Record[];
  recordsCollectionRef: AngularFirestoreCollection<Record>;
  model: NewRecord = new NewRecord();
  displayedColumns: string[] = ['date', 'oedometer', 'price', 'amount', 'star'];

  constructor(public afAuth: AngularFireAuth, private db: AngularFirestore, public snackBar: MatSnackBar) {
    this.afAuth.user
      .pipe(
        map(vasr => {
          return { id: vasr.uid, name: vasr.displayName };
        })
      )
      .subscribe(res => {
        this.userId = res.id;
        this.userName = res.name;

        this.recordsCollectionRef = db.collection<Record>('records', ref => ref.where('userId', '==', this.userId).orderBy('date'));
        this.recordsCollectionRef
          .snapshotChanges()
          .pipe(
            map(changes => {
              return changes.map(a => {
                const data = a.payload.doc.data();
                const id = a.payload.doc.id;
                return { id, ...data };
              });
            })
          )
          .subscribe(data => {
            this.records = data.sort(function(a, b) {
              return b.date.toDate() - a.date.toDate();
            });
          });
      });
  }

  ngOnInit() {}

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

    this.recordsCollectionRef
      .add({
        userId: this.userId,
        amount: Number(this.model.amount),
        price: Number(this.model.price),
        oedometer: Number(this.model.oedometer),
        date: this.model.date.toDate(),
        recordDateTime: new Date()
      })
      .then(
        () => {
          this.snackBar.open('Saved', null, { duration: 4000 });
        },
        error => {
          console.log(error);
          this.snackBar.open('Error', null, { duration: 4000 });
        }
      );
  }

  deleteRow(row) {
    this.recordsCollectionRef.doc(`${row.id}`).delete();
  }

  logIn() {
    this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  }

  logOut() {
    this.afAuth.auth.signOut();
  }
}
