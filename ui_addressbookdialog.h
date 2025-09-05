/********************************************************************************
** Form generated from reading UI file 'addressbookdialog.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_ADDRESSBOOKDIALOG_H
#define UI_ADDRESSBOOKDIALOG_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QHeaderView>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QSpacerItem>
#include <QtWidgets/QTreeView>
#include <QtWidgets/QVBoxLayout>

QT_BEGIN_NAMESPACE

class Ui_AddressBookDialog
{
public:
    QVBoxLayout *verticalLayout;
    QTreeView *m_addressBookView;
    QHBoxLayout *horizontalLayout;
    QSpacerItem *horizontalSpacer;
    QPushButton *m_okButton;
    QSpacerItem *horizontalSpacer_2;

    void setupUi(QDialog *AddressBookDialog)
    {
        if (AddressBookDialog->objectName().isEmpty())
            AddressBookDialog->setObjectName(QString::fromUtf8("AddressBookDialog"));
        AddressBookDialog->resize(747, 525);
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        AddressBookDialog->setFont(font);
        AddressBookDialog->setStyleSheet(QString::fromUtf8("background-color: #282d31; color: #ddd;"));
        verticalLayout = new QVBoxLayout(AddressBookDialog);
        verticalLayout->setObjectName(QString::fromUtf8("verticalLayout"));
        verticalLayout->setContentsMargins(15, 15, 15, 15);
        m_addressBookView = new QTreeView(AddressBookDialog);
        m_addressBookView->setObjectName(QString::fromUtf8("m_addressBookView"));
        QFont font1;
        m_addressBookView->setFont(font1);
        m_addressBookView->setStyleSheet(QString::fromUtf8("background-color: #282d31; color: #ddd; border: 0px;\n"
""));

        verticalLayout->addWidget(m_addressBookView);

        horizontalLayout = new QHBoxLayout();
        horizontalLayout->setObjectName(QString::fromUtf8("horizontalLayout"));
        horizontalSpacer = new QSpacerItem(40, 20, QSizePolicy::Expanding, QSizePolicy::Minimum);

        horizontalLayout->addItem(horizontalSpacer);

        m_okButton = new QPushButton(AddressBookDialog);
        m_okButton->setObjectName(QString::fromUtf8("m_okButton"));
        m_okButton->setMinimumSize(QSize(210, 40));
        m_okButton->setFont(font1);
        m_okButton->setStyleSheet(QString::fromUtf8("QPushButton#m_okButton\n"
"{\n"
"    color: #ffcb00; \n"
"    border: 1px solid #ffcb00;\n"
"    font-size: 16px;\n"
"    border-radius: 5px; \n"
"}\n"
"\n"
"QPushButton#m_okButton:hover\n"
"{\n"
"    color: black;\n"
"    border: 1px solid #ffcb00;\n"
"    font-size: 16px;\n"
"    border-radius: 5px;\n"
"    background-color: #ffcb00;\n"
"    \n"
"}"));

        horizontalLayout->addWidget(m_okButton);

        horizontalSpacer_2 = new QSpacerItem(40, 20, QSizePolicy::Expanding, QSizePolicy::Minimum);

        horizontalLayout->addItem(horizontalSpacer_2);


        verticalLayout->addLayout(horizontalLayout);


        retranslateUi(AddressBookDialog);
        QObject::connect(m_okButton, SIGNAL(clicked()), AddressBookDialog, SLOT(accept()));
        QObject::connect(m_addressBookView, SIGNAL(doubleClicked(QModelIndex)), AddressBookDialog, SLOT(accept()));

        QMetaObject::connectSlotsByName(AddressBookDialog);
    } // setupUi

    void retranslateUi(QDialog *AddressBookDialog)
    {
        AddressBookDialog->setWindowTitle(QCoreApplication::translate("AddressBookDialog", "Select address", nullptr));
        m_okButton->setText(QCoreApplication::translate("AddressBookDialog", "CHOOSE", nullptr));
    } // retranslateUi

};

namespace Ui {
    class AddressBookDialog: public Ui_AddressBookDialog {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_ADDRESSBOOKDIALOG_H
