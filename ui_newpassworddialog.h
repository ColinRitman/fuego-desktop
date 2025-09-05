/********************************************************************************
** Form generated from reading UI file 'newpassworddialog.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_NEWPASSWORDDIALOG_H
#define UI_NEWPASSWORDDIALOG_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include <QtWidgets/QGridLayout>
#include <QtWidgets/QGroupBox>
#include <QtWidgets/QLabel>
#include <QtWidgets/QLineEdit>
#include <QtWidgets/QPushButton>

QT_BEGIN_NAMESPACE

class Ui_NewPasswordDialog
{
public:
    QGridLayout *gridLayout;
    QGroupBox *groupBox;
    QLabel *label_3;
    QLabel *label;
    QLineEdit *m_passwordEdit;
    QLabel *label_2;
    QLineEdit *m_passwordConfirmationEdit;
    QLabel *m_errorLabel;
    QPushButton *b1_okButton;
    QPushButton *b1_cancelButton;

    void setupUi(QDialog *NewPasswordDialog)
    {
        if (NewPasswordDialog->objectName().isEmpty())
            NewPasswordDialog->setObjectName(QString::fromUtf8("NewPasswordDialog"));
        NewPasswordDialog->resize(450, 450);
        QSizePolicy sizePolicy(QSizePolicy::Fixed, QSizePolicy::Fixed);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(NewPasswordDialog->sizePolicy().hasHeightForWidth());
        NewPasswordDialog->setSizePolicy(sizePolicy);
        NewPasswordDialog->setStyleSheet(QString::fromUtf8("background-color: #282d31; color: #ddd; border: 0px;"));
        gridLayout = new QGridLayout(NewPasswordDialog);
        gridLayout->setObjectName(QString::fromUtf8("gridLayout"));
        gridLayout->setContentsMargins(0, 0, 0, 0);
        groupBox = new QGroupBox(NewPasswordDialog);
        groupBox->setObjectName(QString::fromUtf8("groupBox"));
        groupBox->setStyleSheet(QString::fromUtf8(""));
        label_3 = new QLabel(groupBox);
        label_3->setObjectName(QString::fromUtf8("label_3"));
        label_3->setGeometry(QRect(50, 40, 351, 31));
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        font.setPointSize(15);
        label_3->setFont(font);
        label_3->setStyleSheet(QString::fromUtf8("color: #ddd; border-right: 0px;"));
        label_3->setAlignment(Qt::AlignCenter);
        label = new QLabel(groupBox);
        label->setObjectName(QString::fromUtf8("label"));
        label->setGeometry(QRect(50, 110, 331, 31));
        QSizePolicy sizePolicy1(QSizePolicy::Maximum, QSizePolicy::Preferred);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(label->sizePolicy().hasHeightForWidth());
        label->setSizePolicy(sizePolicy1);
        label->setMinimumSize(QSize(0, 25));
        QFont font1;
        font1.setFamily(QString::fromUtf8("Poppins"));
        label->setFont(font1);
        label->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;"));
        m_passwordEdit = new QLineEdit(groupBox);
        m_passwordEdit->setObjectName(QString::fromUtf8("m_passwordEdit"));
        m_passwordEdit->setGeometry(QRect(50, 140, 351, 41));
        QSizePolicy sizePolicy2(QSizePolicy::Expanding, QSizePolicy::Fixed);
        sizePolicy2.setHorizontalStretch(0);
        sizePolicy2.setVerticalStretch(0);
        sizePolicy2.setHeightForWidth(m_passwordEdit->sizePolicy().hasHeightForWidth());
        m_passwordEdit->setSizePolicy(sizePolicy2);
        m_passwordEdit->setMinimumSize(QSize(0, 31));
        m_passwordEdit->setFont(font1);
        m_passwordEdit->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa;"));
        m_passwordEdit->setEchoMode(QLineEdit::Password);
        label_2 = new QLabel(groupBox);
        label_2->setObjectName(QString::fromUtf8("label_2"));
        label_2->setGeometry(QRect(50, 190, 321, 31));
        sizePolicy1.setHeightForWidth(label_2->sizePolicy().hasHeightForWidth());
        label_2->setSizePolicy(sizePolicy1);
        label_2->setMinimumSize(QSize(0, 25));
        label_2->setFont(font1);
        label_2->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;"));
        m_passwordConfirmationEdit = new QLineEdit(groupBox);
        m_passwordConfirmationEdit->setObjectName(QString::fromUtf8("m_passwordConfirmationEdit"));
        m_passwordConfirmationEdit->setGeometry(QRect(50, 220, 351, 41));
        m_passwordConfirmationEdit->setMinimumSize(QSize(0, 31));
        m_passwordConfirmationEdit->setFont(font1);
        m_passwordConfirmationEdit->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa;"));
        m_passwordConfirmationEdit->setEchoMode(QLineEdit::Password);
        m_errorLabel = new QLabel(groupBox);
        m_errorLabel->setObjectName(QString::fromUtf8("m_errorLabel"));
        m_errorLabel->setGeometry(QRect(0, 70, 451, 21));
        m_errorLabel->setFont(font1);
        m_errorLabel->setStyleSheet(QString::fromUtf8("color: #ffcb00;border-right: 0px;"));
        m_errorLabel->setAlignment(Qt::AlignCenter);
        b1_okButton = new QPushButton(groupBox);
        b1_okButton->setObjectName(QString::fromUtf8("b1_okButton"));
        b1_okButton->setEnabled(false);
        b1_okButton->setGeometry(QRect(50, 300, 351, 41));
        b1_okButton->setMinimumSize(QSize(131, 31));
        b1_okButton->setFont(font1);
        b1_okButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));
        b1_cancelButton = new QPushButton(groupBox);
        b1_cancelButton->setObjectName(QString::fromUtf8("b1_cancelButton"));
        b1_cancelButton->setGeometry(QRect(50, 360, 351, 41));
        b1_cancelButton->setMinimumSize(QSize(131, 31));
        b1_cancelButton->setFont(font1);
        b1_cancelButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));

        gridLayout->addWidget(groupBox, 0, 0, 1, 2);


        retranslateUi(NewPasswordDialog);
        QObject::connect(b1_okButton, SIGNAL(clicked()), NewPasswordDialog, SLOT(accept()));
        QObject::connect(b1_cancelButton, SIGNAL(clicked()), NewPasswordDialog, SLOT(reject()));
        QObject::connect(m_passwordEdit, SIGNAL(textChanged(QString)), NewPasswordDialog, SLOT(checkPassword(QString)));
        QObject::connect(m_passwordConfirmationEdit, SIGNAL(textChanged(QString)), NewPasswordDialog, SLOT(checkPassword(QString)));

        b1_okButton->setDefault(true);


        QMetaObject::connectSlotsByName(NewPasswordDialog);
    } // setupUi

    void retranslateUi(QDialog *NewPasswordDialog)
    {
        NewPasswordDialog->setWindowTitle(QCoreApplication::translate("NewPasswordDialog", "Enter password", nullptr));
        groupBox->setTitle(QString());
        label_3->setText(QCoreApplication::translate("NewPasswordDialog", "New Password", nullptr));
        label->setText(QCoreApplication::translate("NewPasswordDialog", "New Password", nullptr));
        label_2->setText(QCoreApplication::translate("NewPasswordDialog", "Confirm Password", nullptr));
        m_errorLabel->setText(QCoreApplication::translate("NewPasswordDialog", "Password not confirmed", nullptr));
        b1_okButton->setText(QCoreApplication::translate("NewPasswordDialog", "SAVE", nullptr));
        b1_cancelButton->setText(QCoreApplication::translate("NewPasswordDialog", "CLOSE", nullptr));
    } // retranslateUi

};

namespace Ui {
    class NewPasswordDialog: public Ui_NewPasswordDialog {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_NEWPASSWORDDIALOG_H
