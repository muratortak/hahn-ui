import { inject, NewInstance } from 'aurelia-framework';
import { ValidationController, ValidationControllerFactory, ValidationRules } from 'aurelia-validation';
import {DialogService} from 'aurelia-dialog';
import { HttpClient, json } from 'aurelia-fetch-client';
import { Popup } from './modal/popup';

let httpClient = new HttpClient();
httpClient.configure(config => {
  config
    .useStandardConfiguration()
    .withBaseUrl('https://localhost:5001/api/')
    .withDefaults({
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'Fetch',
        'Access-Control-Expose-Headers': 'Location'
      }
    })
  });

@inject(NewInstance.of(ValidationController), NewInstance.of(DialogService))
export class App {
  public name : string = '';
  public FamilyName : string = '';
  public Address : string = '';
  public Age : string = '';
  public EmailAddress : string = '';
  public CountryOfOrigin : string = '';
  public isHired;
  public Message : string = '';
  public Link : string = '';
  public reset = true;
  formValidationController;
  public dialogService;
  static inject = [DialogService];
  constructor(formValidationController, dialogService) {
    this.dialogService = dialogService;
    this.formValidationController = formValidationController;
    const formRules = ValidationRules.ensure((res: App) => res.name).required().minLength(5).withMessage("Name should be at least 5")
    .ensure((res: App) => res.FamilyName).required().minLength(5).withMessage("FamilyName should be at least 5")
    .ensure((res: App) => res.Address).required().withMessage("Address can't be empty")
    .ensure((res: App) => res.Age).required().between(20, 60).withMessage("Age should be between 20 and 60")
    .ensure((res: App) => res.EmailAddress).required().email().withMessage("Email not in the correct format")
    .ensure((res: App) => res.CountryOfOrigin).required().withMessage("Country of Origin can't be empty").rules;
    this.formValidationController.addObject(this, formRules);
    console.log(this.formValidationController);
    this.isHired = false;
  }

  attached() {
    this.formValidationController.validate();
  }

  // If all inputs are empty disable the 'Reset' button.
  public changed() {
    this.reset = true;
    Object.keys(this).forEach(key => {
      if(typeof this[key] === 'string'){
        if(this[key].toString().length !== 0) {
          this.reset = false;
        }
      }
    })
  }
  
  // Submit 
  public save() {
   this.formValidationController.validate()
    .then(result => {
      if(result.valid) {
        let applicant = {
          Name: this.name,
          FamilyName: this.FamilyName,
          Address: this.Address,
          CountryOfOrigin: this.CountryOfOrigin,
          EmailAddress: this.EmailAddress,
          Age: parseInt(this.Age),
          Hired: this.isHired
        }

        httpClient.fetch('applicant', {
          method: 'POST',
          body: json(applicant)
        })
        .then(response => response.headers.get('Location'))
        .then(saved => {
          this.Message = `Find the new created applicant at the link:`;
          this.Link = `${saved}`;
        })
        .catch(err =>  {
          err.json()
          .then(returnError => {
            let errorKey = Object.keys(returnError.errors);
            let errorKeySingle = errorKey[0];
            this.Link = "";
            this.Message = returnError.errors[errorKeySingle];
          })
        })
        .catch(connErr => {this.Message = 'Connection Error'})
      } else {
        console.log('resul is not valid')
      }
    }).catch(err => console.log("Error in result in save"))
  }


  // Open the dialog
  public openModal() {
    this.dialogService.open( {viewModel: Popup, model: 'Are you sure?' })
    .whenClosed()
    .then(response => {
      console.log(response);
    
      if (!response.wasCancelled) {
          this.name = '';
          this.FamilyName = '';
          this.Address = '';
          this.Age = '';
          this.EmailAddress = '';
          this.CountryOfOrigin = '';
          this.isHired = false;
          this.Message = '';
          this.reset = true;
      } else {
          console.log('cancelled');
      }
      
    });
  }


}


