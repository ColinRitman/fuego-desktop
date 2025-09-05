/********************************************************************************
** Form generated from reading UI file 'changepassworddialog.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_CHANGEPASSWORDDIALOG_H
#define UI_CHANGEPASSWORDDIALOG_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include <QtWidgets/QGridLayout>
#include <QtWidgets/QGroupBox>
#include <QtWidgets/QLabel>
#include <QtWidgets/QLineEdit>
#include <QtWidgets/QPushButton>

QT_BEGIN_NAMESPACE

class Ui_ChangePasswordDialog
{
public:
    QGridLayout *gridLayout;
    QGroupBox *groupBox;
    QLabel *label_3;
    QLineEdit *m_oldPasswordEdit;
    QLabel *label;
    QLineEdit *m_newPasswordEdit;
    QLabel *label_2;
    QLineEdit *m_newPasswordConfirmationEdit;
    QLabel *m_errorLabel;
    QPushButton *b1_okButton;
    QPushButton *b1_cancelButton;
    QLabel *label_4;

    void setupUi(QDialog *ChangePasswordDialog)
    {
        if (ChangePasswordDialog->objectName().isEmpty())
            ChangePasswordDialog->setObjectName(QString::fromUtf8("ChangePasswordDialog"));
        ChangePasswordDialog->resize(450, 500);
        QSizePolicy sizePolicy(QSizePolicy::Fixed, QSizePolicy::Fixed);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(ChangePasswordDialog->sizePolicy().hasHeightForWidth());
        ChangePasswordDialog->setSizePolicy(sizePolicy);
        ChangePasswordDialog->setMinimumSize(QSize(338, 0));
        ChangePasswordDialog->setMaximumSize(QSize(450, 550));
        ChangePasswordDialog->setStyleSheet(QString::fromUtf8("background-color: #282d31; color: #ddd; border: 0px;"));
        gridLayout = new QGridLayout(ChangePasswordDialog);
        gridLayout->setObjectName(QString::fromUtf8("gridLayout"));
        gridLayout->setContentsMargins(0, 0, 0, 0);
        groupBox = new QGroupBox(ChangePasswordDialog);
        groupBox->setObjectName(QString::fromUtf8("groupBox"));
        groupBox->setStyleSheet(QString::fromUtf8(""));
        label_3 = new QLabel(groupBox);
        label_3->setObjectName(QString::fromUtf8("label_3"));
        label_3->setGeometry(QRect(50, 100, 351, 31));
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        label_3->setFont(font);
        label_3->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;"));
        m_oldPasswordEdit = new QLineEdit(groupBox);
        m_oldPasswordEdit->setObjectName(QString::fromUtf8("m_oldPasswordEdit"));
        m_oldPasswordEdit->setGeometry(QRect(50, 130, 351, 41));
        m_oldPasswordEdit->setMinimumSize(QSize(0, 25));
        m_oldPasswordEdit->setFont(font);
        m_oldPasswordEdit->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa;"));
        m_oldPasswordEdit->setEchoMode(QLineEdit::Password);
        label = new QLabel(groupBox);
        label->setObjectName(QString::fromUtf8("label"));
        label->setGeometry(QRect(50, 180, 351, 31));
        QSizePolicy sizePolicy1(QSizePolicy::Maximum, QSizePolicy::Preferred);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(label->sizePolicy().hasHeightForWidth());
        label->setSizePolicy(sizePolicy1);
        label->setFont(font);
        label->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;"));
        m_newPasswordEdit = new QLineEdit(groupBox);
        m_newPasswordEdit->setObjectName(QString::fromUtf8("m_newPasswordEdit"));
        m_newPasswordEdit->setGeometry(QRect(50, 210, 351, 41));
        QSizePolicy sizePolicy2(QSizePolicy::Expanding, QSizePolicy::Fixed);
        sizePolicy2.setHorizontalStretch(0);
        sizePolicy2.setVerticalStretch(0);
        sizePolicy2.setHeightForWidth(m_newPasswordEdit->sizePolicy().hasHeightForWidth());
        m_newPasswordEdit->setSizePolicy(sizePolicy2);
        m_newPasswordEdit->setMinimumSize(QSize(0, 25));
        m_newPasswordEdit->setFont(font);
        m_newPasswordEdit->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa;"));
        m_newPasswordEdit->setEchoMode(QLineEdit::Password);
        label_2 = new QLabel(groupBox);
        label_2->setObjectName(QString::fromUtf8("label_2"));
        label_2->setGeometry(QRect(50, 260, 351, 31));
        sizePolicy1.setHeightForWidth(label_2->sizePolicy().hasHeightForWidth());
        label_2->setSizePolicy(sizePolicy1);
        label_2->setFont(font);
        label_2->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;"));
        m_newPasswordConfirmationEdit = new QLineEdit(groupBox);
        m_newPasswordConfirmationEdit->setObjectName(QString::fromUtf8("m_newPasswordConfirmationEdit"));
        m_newPasswordConfirmationEdit->setGeometry(QRect(50, 290, 351, 41));
        m_newPasswordConfirmationEdit->setMinimumSize(QSize(0, 25));
        m_newPasswordConfirmationEdit->setFont(font);
        m_newPasswordConfirmationEdit->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa;"));
        m_newPasswordConfirmationEdit->setEchoMode(QLineEdit::Password);
        m_errorLabel = new QLabel(groupBox);
        m_errorLabel->setObjectName(QString::fromUtf8("m_errorLabel"));
        m_errorLabel->setGeometry(QRect(50, 60, 351, 25));
        QFont font1;
        font1.setFamily(QString::fromUtf8("Poppins"));
        font1.setBold(false);
        font1.setItalic(false);
        font1.setWeight(50);
        m_errorLabel->setFont(font1);
        m_errorLabel->setStyleSheet(QString::fromUtf8("color: #ffcb00;border-right: 0px;"));
        m_errorLabel->setAlignment(Qt::AlignCenter);
        b1_okButton = new QPushButton(groupBox);
        b1_okButton->setObjectName(QString::fromUtf8("b1_okButton"));
        b1_okButton->setEnabled(false);
        b1_okButton->setGeometry(QRect(50, 360, 351, 41));
        b1_okButton->setMinimumSize(QSize(0, 25));
        b1_okButton->setFont(font);
        b1_okButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));
        b1_cancelButton = new QPushButton(groupBox);
        b1_cancelButton->setObjectName(QString::fromUtf8("b1_cancelButton"));
        b1_cancelButton->setGeometry(QRect(50, 420, 351, 41));
        b1_cancelButton->setMinimumSize(QSize(0, 25));
        b1_cancelButton->setFont(font);
        b1_cancelButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));
        label_4 = new QLabel(groupBox);
        label_4->setObjectName(QString::fromUtf8("label_4"));
        label_4->setGeometry(QRect(50, 30, 351, 31));
        QFont font2;
        label_4->setFont(font2);
        label_4->setStyleSheet(QString::fromUtf8("color: #ddd;\n"
"border-right: 0px;\n"
"font-size: 20px;"));
        label_4->setAlignment(Qt::AlignCenter);

        gridLayout->addWidget(groupBox, 0, 0, 1, 2);


        retranslateUi(ChangePasswordDialog);
        QObject::connect(m_newPasswordEdit, SIGNAL(textChanged(QString)), ChangePasswordDialog, SLOT(checkPassword(QString)));
        QObject::connect(m_newPasswordConfirmationEdit, SIGNAL(textChanged(QString)), ChangePasswordDialog, SLOT(checkPassword(QString)));
        QObject::connect(b1_okButton, SIGNAL(clicked()), ChangePasswordDialog, SLOT(accept()));
        QObject::connect(b1_cancelButton, SIGNAL(clicked()), ChangePasswordDialog, SLOT(reject()));

        b1_okButton->setDefault(true);


        QMetaObject::connectSlotsByName(ChangePasswordDialog);
    } // setupUi

    void retranslateUi(QDialog *ChangePasswordDialog)
    {
        ChangePasswordDialog->setWindowTitle(QCoreApplication::translate("ChangePasswordDialog", "Change Password", nullptr));
        groupBox->setTitle(QString());
        label_3->setText(QCoreApplication::translate("ChangePasswordDialog", "Current Password", nullptr));
        label->setText(QCoreApplication::translate("ChangePasswordDialog", "New Password", nullptr));
        label_2->setText(QCoreApplication::translate("ChangePasswordDialog", "Confirm New Password", nullptr));
        m_errorLabel->setText(QCoreApplication::translate("ChangePasswordDialog", "Password not confirmed", nullptr));
        b1_okButton->setText(QCoreApplication::translate("ChangePasswordDialog", "SAVE", nullptr));
        b1_cancelButton->setText(QCoreApplication::translate("ChangePasswordDialog", "CANCEL", nullptr));
        label_4->setText(QCoreApplication::translate("ChangePasswordDialog", "Change Password", nullptr));
    } // retranslateUi

};

namespace Ui {
    class ChangePasswordDialog: public Ui_ChangePasswordDialog {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_CHANGEPASSWORDDIALOG_H
