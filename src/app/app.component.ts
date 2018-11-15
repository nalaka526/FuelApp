import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Record } from 'src/app/record.model';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import { MatSnackBar } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

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

  authState: any;
  recordForm: FormGroup;
  records: Record[];
  recordsCollectionRef: AngularFirestoreCollection<Record>;
  displayedColumns: string[] = ['date', 'oedometer', 'price', 'amount', 'star'];

  constructor(public afa: AngularFireAuth, private afs: AngularFirestore, public snackBar: MatSnackBar) {
    this.afa.authState.subscribe(au => {
      this.authState = au;
    });

    this.afa.user.subscribe(user => {
      if (user != null) {
        this.userId = user.uid;
        this.userName = user.displayName;
        this.bindDtaa();
      }
    });
  }

  ngOnInit() {
    this.recordForm = new FormGroup({
      amount: new FormControl('', Validators.required),
      price: new FormControl('', Validators.required),
      oedometer: new FormControl('', Validators.required),
      date: new FormControl(new Date(), Validators.required)
    });

    if (this.authenticated) {
      this.loadUser();
    }
  }

  loadUser() {
    if (this.authenticated) {
      this.userId = this.authState.uid;
      this.userName = this.authState.displayName;
      this.bindDtaa();
    }
  }

  bindDtaa() {
    this.recordsCollectionRef = this.afs.collection<Record>('records', ref => ref.where('userId', '==', this.userId).orderBy('date', 'desc'));
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
        this.records = data;
      });
  }

  createRecord() {
    const formData = this.recordForm.value;

    if (typeof formData.amount != 'number') {
      return;
    }

    if (typeof formData.price != 'number') {
      return;
    }

    if (typeof formData.oedometer != 'number') {
      return;
    }

    if (formData.date == null) {
      return;
    }

    this.recordsCollectionRef
      .add({
        userId: this.userId,
        amount: Number(formData.amount),
        price: Number(formData.price),
        oedometer: Number(formData.oedometer),
        date: new Date(formData.date),
        recordDateTime: new Date()
      })
      .then(
        () => {
          this.recordForm.reset({ date: new Date() });
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
    const gooleAuthProvider = new auth.GoogleAuthProvider();

    gooleAuthProvider.setCustomParameters({
      prompt: 'select_account'
    });

    return this.afa.auth
      .signInWithPopup(gooleAuthProvider)
      .then(() => this.loadUser())
      .catch(error => console.log(error));
  }

  logOut() {
    this.afa.auth.signOut();
    this.userId = null;
    this.userName = null;
  }

  get authenticated(): boolean {
    return this.authState != null || this.authState != undefined;
  }
}
