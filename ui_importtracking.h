/********************************************************************************
** Form generated from reading UI file 'importtracking.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_IMPORTTRACKING_H
#define UI_IMPORTTRACKING_H

#include <QtCore/QVariant>
#include <QtGui/QIcon>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include <QtWidgets/QGroupBox>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QLineEdit>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QSpacerItem>
#include <QtWidgets/QToolButton>
#include <QtWidgets/QVBoxLayout>

QT_BEGIN_NAMESPACE

class Ui_ImportTracking
{
public:
    QVBoxLayout *verticalLayout;
    QGroupBox *groupBox;
    QVBoxLayout *verticalLayout_2;
    QLabel *label_3;
    QLabel *label_4;
    QSpacerItem *verticalSpacer;
    QLabel *label;
    QLineEdit *m_trackingKey;
    QSpacerItem *verticalSpacer_2;
    QLabel *label_2;
    QLabel *label_6;
    QGroupBox *horizontalGroupBox_1;
    QHBoxLayout *horizontalLayout;
    QLineEdit *m_pathEdit;
    QToolButton *m_selectPathButton;
    QSpacerItem *verticalSpacer_3;
    QGroupBox *horizontalGroupBox_2;
    QHBoxLayout *horizontalLayout_2;
    QPushButton *b1_okButton;
    QGroupBox *horizontalGroupBox_3;
    QHBoxLayout *horizontalLayout_3;
    QPushButton *b1_cancelButton;

    void setupUi(QDialog *ImportTracking)
    {
        if (ImportTracking->objectName().isEmpty())
            ImportTracking->setObjectName(QString::fromUtf8("ImportTracking"));
        ImportTracking->resize(480, 500);
        ImportTracking->setStyleSheet(QString::fromUtf8("background-color: #282d31; color: #ddd; border: 0px;"));
        verticalLayout = new QVBoxLayout(ImportTracking);
        verticalLayout->setSpacing(6);
        verticalLayout->setObjectName(QString::fromUtf8("verticalLayout"));
        verticalLayout->setContentsMargins(0, 0, 0, 0);
        groupBox = new QGroupBox(ImportTracking);
        groupBox->setObjectName(QString::fromUtf8("groupBox"));
        groupBox->setStyleSheet(QString::fromUtf8(""));
        verticalLayout_2 = new QVBoxLayout(groupBox);
        verticalLayout_2->setSpacing(6);
        verticalLayout_2->setObjectName(QString::fromUtf8("verticalLayout_2"));
        verticalLayout_2->setContentsMargins(50, 20, 50, 20);
        label_3 = new QLabel(groupBox);
        label_3->setObjectName(QString::fromUtf8("label_3"));
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        font.setBold(true);
        font.setWeight(75);
        label_3->setFont(font);
        label_3->setStyleSheet(QString::fromUtf8("color: #fff;\n"
"border-right: 0px;\n"
"font-size: 20px;\n"
"font-weight: bold;"));
        label_3->setAlignment(Qt::AlignCenter);

        verticalLayout_2->addWidget(label_3);

        label_4 = new QLabel(groupBox);
        label_4->setObjectName(QString::fromUtf8("label_4"));
        QFont font1;
        font1.setFamily(QString::fromUtf8("Poppins"));
        label_4->setFont(font1);
        label_4->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;"));
        label_4->setAlignment(Qt::AlignCenter);
        label_4->setWordWrap(true);

        verticalLayout_2->addWidget(label_4);

        verticalSpacer = new QSpacerItem(20, 40, QSizePolicy::Minimum, QSizePolicy::Expanding);

        verticalLayout_2->addItem(verticalSpacer);

        label = new QLabel(groupBox);
        label->setObjectName(QString::fromUtf8("label"));
        label->setFont(font);
        label->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;\n"
"font-weight: bold;"));

        verticalLayout_2->addWidget(label);

        m_trackingKey = new QLineEdit(groupBox);
        m_trackingKey->setObjectName(QString::fromUtf8("m_trackingKey"));
        m_trackingKey->setMinimumSize(QSize(0, 40));
        m_trackingKey->setFont(font1);
        m_trackingKey->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa; padding: 5px;"));

        verticalLayout_2->addWidget(m_trackingKey);

        verticalSpacer_2 = new QSpacerItem(20, 20, QSizePolicy::Minimum, QSizePolicy::Expanding);

        verticalLayout_2->addItem(verticalSpacer_2);

        label_2 = new QLabel(groupBox);
        label_2->setObjectName(QString::fromUtf8("label_2"));
        label_2->setFont(font);
        label_2->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;\n"
"font-weight: bold;"));

        verticalLayout_2->addWidget(label_2);

        label_6 = new QLabel(groupBox);
        label_6->setObjectName(QString::fromUtf8("label_6"));

        verticalLayout_2->addWidget(label_6);

        horizontalGroupBox_1 = new QGroupBox(groupBox);
        horizontalGroupBox_1->setObjectName(QString::fromUtf8("horizontalGroupBox_1"));
        horizontalLayout = new QHBoxLayout(horizontalGroupBox_1);
        horizontalLayout->setSpacing(6);
        horizontalLayout->setObjectName(QString::fromUtf8("horizontalLayout"));
        horizontalLayout->setContentsMargins(0, 0, 0, 0);
        m_pathEdit = new QLineEdit(horizontalGroupBox_1);
        m_pathEdit->setObjectName(QString::fromUtf8("m_pathEdit"));
        m_pathEdit->setMinimumSize(QSize(0, 40));
        m_pathEdit->setFont(font1);
        m_pathEdit->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa; padding: 5px;"));

        horizontalLayout->addWidget(m_pathEdit);

        m_selectPathButton = new QToolButton(horizontalGroupBox_1);
        m_selectPathButton->setObjectName(QString::fromUtf8("m_selectPathButton"));
        m_selectPathButton->setMinimumSize(QSize(40, 40));
        m_selectPathButton->setFont(font1);
        m_selectPathButton->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa;"));
        m_selectPathButton->setText(QString::fromUtf8(""));
        QIcon icon;
        icon.addFile(QString::fromUtf8(":/icons/folder"), QSize(), QIcon::Normal, QIcon::Off);
        m_selectPathButton->setIcon(icon);

        horizontalLayout->addWidget(m_selectPathButton);


        verticalLayout_2->addWidget(horizontalGroupBox_1);

        verticalSpacer_3 = new QSpacerItem(20, 40, QSizePolicy::Minimum, QSizePolicy::Expanding);

        verticalLayout_2->addItem(verticalSpacer_3);

        horizontalGroupBox_2 = new QGroupBox(groupBox);
        horizontalGroupBox_2->setObjectName(QString::fromUtf8("horizontalGroupBox_2"));
        horizontalLayout_2 = new QHBoxLayout(horizontalGroupBox_2);
        horizontalLayout_2->setSpacing(0);
        horizontalLayout_2->setObjectName(QString::fromUtf8("horizontalLayout_2"));
        horizontalLayout_2->setContentsMargins(0, 0, 0, 0);
        b1_okButton = new QPushButton(horizontalGroupBox_2);
        b1_okButton->setObjectName(QString::fromUtf8("b1_okButton"));
        b1_okButton->setMinimumSize(QSize(125, 31));
        b1_okButton->setMaximumSize(QSize(300, 16777215));
        b1_okButton->setFont(font1);
        b1_okButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));

        horizontalLayout_2->addWidget(b1_okButton);


        verticalLayout_2->addWidget(horizontalGroupBox_2);

        horizontalGroupBox_3 = new QGroupBox(groupBox);
        horizontalGroupBox_3->setObjectName(QString::fromUtf8("horizontalGroupBox_3"));
        horizontalLayout_3 = new QHBoxLayout(horizontalGroupBox_3);
        horizontalLayout_3->setSpacing(0);
        horizontalLayout_3->setObjectName(QString::fromUtf8("horizontalLayout_3"));
        horizontalLayout_3->setContentsMargins(0, 0, 0, 0);
        b1_cancelButton = new QPushButton(horizontalGroupBox_3);
        b1_cancelButton->setObjectName(QString::fromUtf8("b1_cancelButton"));
        b1_cancelButton->setMinimumSize(QSize(125, 31));
        b1_cancelButton->setMaximumSize(QSize(300, 16777215));
        b1_cancelButton->setFont(font1);
        b1_cancelButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));

        horizontalLayout_3->addWidget(b1_cancelButton);


        verticalLayout_2->addWidget(horizontalGroupBox_3);


        verticalLayout->addWidget(groupBox);


        retranslateUi(ImportTracking);
        QObject::connect(b1_okButton, SIGNAL(clicked()), ImportTracking, SLOT(accept()));
        QObject::connect(b1_cancelButton, SIGNAL(clicked()), ImportTracking, SLOT(reject()));
        QObject::connect(m_selectPathButton, SIGNAL(clicked()), ImportTracking, SLOT(selectPathClicked()));

        QMetaObject::connectSlotsByName(ImportTracking);
    } // setupUi

    void retranslateUi(QDialog *ImportTracking)
    {
        ImportTracking->setWindowTitle(QCoreApplication::translate("ImportTracking", "Import", nullptr));
        groupBox->setTitle(QString());
        label_3->setText(QCoreApplication::translate("ImportTracking", "Import Tracking Key", nullptr));
        label_4->setText(QCoreApplication::translate("ImportTracking", "Import a tracking wallet (view-only)", nullptr));
        label->setText(QCoreApplication::translate("ImportTracking", "Tracking Key", nullptr));
        label_2->setText(QCoreApplication::translate("ImportTracking", "Wallet Path", nullptr));
        label_6->setText(QCoreApplication::translate("ImportTracking", "Where would you like to save your wallet?", nullptr));
        b1_okButton->setText(QCoreApplication::translate("ImportTracking", "IMPORT", nullptr));
        b1_cancelButton->setText(QCoreApplication::translate("ImportTracking", "CANCEL", nullptr));
    } // retranslateUi

};

namespace Ui {
    class ImportTracking: public Ui_ImportTracking {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_IMPORTTRACKING_H
